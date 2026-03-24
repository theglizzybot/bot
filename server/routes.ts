import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { discordBot } from "./discord-bot";
import { insertApplicationSchema, sendMessageSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".mp3", ".ogg", ".wav", ".flac", ".m4a", ".webm"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only audio files allowed (mp3, ogg, wav, flac, m4a, webm)"));
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/bot/status", async (req, res) => {
    try {
      const status = discordBot.getStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/discord/bot/info", async (req, res) => {
    try {
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot is not ready yet" });
      const info = discordBot.getBotInfo();
      const nicknames = discordBot.getServerNicknames();
      res.json({ ...info, nicknames });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discord/bot/avatar", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) return res.status(400).json({ message: "imageUrl is required" });
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot is not ready yet" });
      const result = await discordBot.setBotAvatar(imageUrl);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discord/bot/banner", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) return res.status(400).json({ message: "imageUrl is required" });
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot is not ready yet" });
      const result = await discordBot.setBotBanner(imageUrl);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discord/servers/:id/nickname", async (req, res) => {
    try {
      const { nickname } = req.body;
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot is not ready yet" });
      const result = await discordBot.setServerNickname(req.params.id, nickname ?? "");
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/discord/servers", async (req, res) => {
    try {
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot is not ready yet" });
      const servers = discordBot.getServers();
      res.json(servers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discord/send-dm", async (req, res) => {
    try {
      const { userId, content, embed } = req.body;
      if (!userId || !content)
        return res.status(400).json({ message: "Missing required fields" });
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot is not ready yet" });
      await discordBot.sendDirectMessage(userId, { content, embed });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discord/send-message", async (req, res) => {
    try {
      const validated = sendMessageSchema.parse(req.body);
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot is not ready yet" });

      let embedOptions: any = undefined;
      if (validated.embed) {
        const e = validated.embed;
        embedOptions = {
          title: e.title,
          description: e.description,
          color: e.color,
          thumbnail: e.thumbnail || undefined,
          image: e.image || undefined,
          author: e.authorName
            ? { name: e.authorName, url: e.authorUrl || undefined, iconUrl: e.authorIconUrl || undefined }
            : undefined,
          footer: e.footerText
            ? { text: e.footerText, iconUrl: e.footerIconUrl || undefined }
            : undefined,
          timestamp: e.timestamp,
          fields: e.fields,
        };
      }

      await discordBot.sendMessage(validated.channelId, {
        content: validated.content,
        embed: embedOptions,
        replyTo: req.body.replyTo,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discord/messages/react", async (req, res) => {
    try {
      const { channelId, messageId, emoji } = req.body;
      if (!channelId || !messageId || !emoji) {
        return res.status(400).json({ message: "Channel ID, Message ID and Emoji are required" });
      }
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot is not ready yet" });

      await discordBot.addReaction(channelId, messageId, emoji);
      res.json({ success: true, message: "Reaction added" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/applications", async (req, res) => {
    try {
      const apps = await storage.getApplications();
      res.json(apps);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const validated = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(validated);
      res.status(201).json(application);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/applications/:id/status", async (req, res) => {
    try {
      const application = await storage.updateApplicationStatus(
        req.params.id,
        req.body.status,
      );
      res.json(application);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/applications/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteApplication(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Application not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discord/servers/:id/invite", async (req, res) => {
    try {
      const inviteUrl = await discordBot.createInvite(req.params.id);
      res.json({ inviteUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/discord/messages/:channelId/:messageId", async (req, res) => {
    try {
      await discordBot.deleteMessage(req.params.channelId, req.params.messageId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discord/voice/join", async (req, res) => {
    try {
      await discordBot.joinVoice(req.body.channelId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discord/voice/play-url", async (req, res) => {
    try {
      const { channelId, url } = req.body;
      if (!channelId || !url)
        return res.status(400).json({ message: "channelId and url are required" });
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot is not ready yet" });
      await discordBot.playAudio(channelId, url, false);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discord/voice/play-file", upload.single("audio"), async (req, res) => {
    try {
      const { channelId } = req.body;
      if (!channelId || !req.file)
        return res.status(400).json({ message: "channelId and audio file are required" });
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot is not ready yet" });

      await discordBot.playAudio(channelId, req.file.path, true);

      setTimeout(() => {
        try { fs.unlinkSync(req.file!.path); } catch {}
      }, 30000);

      res.json({ success: true });
    } catch (error: any) {
      if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discord/voice/stop", async (_req, res) => {
    try {
      const result = discordBot.stopAudio();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

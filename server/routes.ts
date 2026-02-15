import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { discordBot } from "./discord-bot";
import { insertApplicationSchema, sendMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Bot-Status abrufen
  app.get("/api/bot/status", async (req, res) => {
    try {
      const status = discordBot.getStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Discord-Server und Kanäle abrufen
  app.get("/api/discord/servers", async (req, res) => {
    try {
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot ist noch nicht bereit" });
      const servers = discordBot.getServers();
      res.json(servers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Nachricht als DM senden
  app.post("/api/discord/send-dm", async (req, res) => {
    try {
      const { userId, content, embed } = req.body;
      if (!userId || !content)
        return res.status(400).json({ message: "Daten fehlen" });
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot ist noch nicht bereit" });
      await discordBot.sendDirectMessage(userId, { content, embed });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Nachricht an Kanal senden
  app.post("/api/discord/send-message", async (req, res) => {
    try {
      const validated = sendMessageSchema.parse(req.body);
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot ist noch nicht bereit" });
      await discordBot.sendMessage(validated.channelId, {
        content: validated.content,
        embed: validated.embed,
        replyTo: req.body.replyTo,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- NEUER ENDPUNKT: REAKTION HINZUFÜGEN ---
  app.post("/api/discord/messages/react", async (req, res) => {
    try {
      const { channelId, messageId, emoji } = req.body;
      if (!channelId || !messageId || !emoji) {
        return res
          .status(400)
          .json({ message: "Channel-ID, Message-ID und Emoji erforderlich" });
      }
      if (!discordBot.isReady())
        return res.status(503).json({ message: "Bot ist noch nicht bereit" });

      await discordBot.addReaction(channelId, messageId, emoji);
      res.json({ success: true, message: "Reaktion hinzugefügt" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Bewerbungen
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

  // Einladungen
  app.post("/api/discord/servers/:id/invite", async (req, res) => {
    try {
      const inviteUrl = await discordBot.createInvite(req.params.id);
      res.json({ inviteUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Nachricht löschen
  app.delete(
    "/api/discord/messages/:channelId/:messageId",
    async (req, res) => {
      try {
        await discordBot.deleteMessage(
          req.params.channelId,
          req.params.messageId,
        );
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    },
  );

  // Voice join
  app.post("/api/discord/voice/join", async (req, res) => {
    try {
      await discordBot.joinVoice(req.body.channelId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

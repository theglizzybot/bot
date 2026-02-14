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
      if (!discordBot.isReady()) {
        return res.status(503).json({ message: "Bot ist noch nicht bereit" });
      }
      const servers = discordBot.getServers();
      res.json(servers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // NEU: Nachricht als DM an einen User senden
  app.post("/api/discord/send-dm", async (req, res) => {
    try {
      const { userId, content, embed } = req.body;

      if (!userId || !content) {
        return res
          .status(400)
          .json({ message: "User-ID und Nachrichtentext fehlen" });
      }

      if (!discordBot.isReady()) {
        return res.status(503).json({ message: "Bot ist noch nicht bereit" });
      }

      await discordBot.sendDirectMessage(userId, { content, embed });
      res.json({ success: true, message: "DM erfolgreich gesendet" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Nachricht an Discord-Kanal senden
  app.post("/api/discord/send-message", async (req, res) => {
    try {
      const validated = sendMessageSchema.parse(req.body);

      if (!discordBot.isReady()) {
        return res.status(503).json({ message: "Bot ist noch nicht bereit" });
      }

      await discordBot.sendMessage(validated.channelId, {
        content: validated.content,
        embed: validated.embed,
      });
      res.json({ success: true, message: "Nachricht erfolgreich gesendet" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Ungültige Daten", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Alle Bewerbungen abrufen
  app.get("/api/applications", async (req, res) => {
    try {
      const applications = await storage.getApplications();
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Neue Bewerbung erstellen
  app.post("/api/applications", async (req, res) => {
    try {
      const validated = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(validated);
      res.status(201).json(application);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Ungültige Daten", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Bewerbungsstatus aktualisieren
  app.patch("/api/applications/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status ist erforderlich" });
      }

      const application = await storage.updateApplicationStatus(id, status);
      if (!application) {
        return res.status(404).json({ message: "Bewerbung nicht gefunden" });
      }

      res.json(application);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Neue Einladung für einen Server erstellen
  app.post("/api/discord/servers/:id/invite", async (req, res) => {
    try {
      const { id } = req.params;
      if (!discordBot.isReady()) {
        return res.status(503).json({ message: "Bot ist noch nicht bereit" });
      }
      const inviteUrl = await discordBot.createInvite(id);
      res.json({ inviteUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Join voice channel
  app.post("/api/discord/voice/join", async (req, res) => {
    try {
      const { channelId } = req.body;
      if (!channelId) {
        return res.status(400).json({ message: "Channel ID is required" });
      }
      if (!discordBot.isReady()) {
        return res.status(503).json({ message: "Bot ist noch nicht bereit" });
      }
      await discordBot.joinVoice(channelId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

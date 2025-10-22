import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Bewerbungen Schema
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordName: text("discord_name").notNull(),
  discordId: text("discord_id").notNull(),
  category: text("category").notNull(), // "Admin-Bewerbung" oder "Member-Bewerbung"
  content: text("content").notNull(),
  status: text("status").notNull().default("Neu"), // "Neu", "In Bearbeitung", "Angenommen", "Abgelehnt"
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  timestamp: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

// Discord Server Info (für Frontend-Typisierung)
export const discordServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  channels: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.number(),
    position: z.number(),
  })),
});

export type DiscordServer = z.infer<typeof discordServerSchema>;

// Bot Status (für Frontend-Typisierung)
export const botStatusSchema = z.object({
  online: z.boolean(),
  uptime: z.number(),
  version: z.string(),
  serverCount: z.number(),
  status: z.string(),
  startTime: z.number(),
});

export type BotStatus = z.infer<typeof botStatusSchema>;

// Nachricht senden Schema
export const sendMessageSchema = z.object({
  channelId: z.string().min(1, "Kanal-ID ist erforderlich"),
  content: z.string().min(1, "Nachricht darf nicht leer sein").max(2000, "Nachricht ist zu lang"),
});

export type SendMessage = z.infer<typeof sendMessageSchema>;

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Bewerbungen Schema
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordName: text("discord_name").notNull(),
  discordId: text("discord_id").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("Neu"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  timestamp: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

// Discord Server Info
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

// Bot Status
export const botStatusSchema = z.object({
  online: z.boolean(),
  uptime: z.number(),
  version: z.string(),
  serverCount: z.number(),
  status: z.string(),
  startTime: z.number(),
});

export type BotStatus = z.infer<typeof botStatusSchema>;

// Embed Field Schema
export const embedFieldSchema = z.object({
  name: z.string().min(1, "Feldname erforderlich"),
  value: z.string().min(1, "Feldwert erforderlich"),
  inline: z.boolean().optional().default(false),
});

// Full Embed Schema
export const embedSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  thumbnail: z.string().url("Ungültige URL").optional().or(z.literal("")),
  image: z.string().url("Ungültige URL").optional().or(z.literal("")),
  authorName: z.string().optional(),
  authorUrl: z.string().url("Ungültige URL").optional().or(z.literal("")),
  authorIconUrl: z.string().url("Ungültige URL").optional().or(z.literal("")),
  footerText: z.string().optional(),
  footerIconUrl: z.string().url("Ungültige URL").optional().or(z.literal("")),
  timestamp: z.boolean().optional().default(false),
  fields: z.array(embedFieldSchema).optional().default([]),
});

export type EmbedData = z.infer<typeof embedSchema>;

// Nachricht senden Schema
export const sendMessageSchema = z.object({
  channelId: z.string().min(1, "Kanal-ID ist erforderlich"),
  content: z.string().max(2000, "Nachricht ist zu lang").optional(),
  embed: embedSchema.optional(),
});

export type SendMessage = z.infer<typeof sendMessageSchema>;

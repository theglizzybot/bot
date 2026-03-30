import { type Application, type InsertApplication, type GuildConfig } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getApplications(): Promise<Application[]>;
  getApplication(id: string): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: string, status: string): Promise<Application | undefined>;
  deleteApplication(id: string): Promise<boolean>;
  getGuildConfig(guildId: string): Promise<GuildConfig>;
  setGuildConfig(guildId: string, patch: { adminRoleIds?: string[]; welcomeChannelId?: string | null }): Promise<GuildConfig>;
}

export class MemStorage implements IStorage {
  private applications: Map<string, Application>;
  private guildConfigs: Map<string, GuildConfig>;

  constructor() {
    this.applications = new Map();
    this.guildConfigs = new Map();
  }

  async getApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }

  async getApplication(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const application: Application = {
      ...insertApplication,
      id,
      timestamp: new Date(),
      status: "New",
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplicationStatus(id: string, status: string): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    const updated: Application = { ...application, status };
    this.applications.set(id, updated);
    return updated;
  }

  async deleteApplication(id: string): Promise<boolean> {
    return this.applications.delete(id);
  }

  async getGuildConfig(guildId: string): Promise<GuildConfig> {
    return this.guildConfigs.get(guildId) ?? { guildId, adminRoleIds: [], welcomeChannelId: null };
  }

  async setGuildConfig(
    guildId: string,
    patch: { adminRoleIds?: string[]; welcomeChannelId?: string | null },
  ): Promise<GuildConfig> {
    const current = await this.getGuildConfig(guildId);
    const updated: GuildConfig = { ...current, ...patch, guildId };
    this.guildConfigs.set(guildId, updated);
    return updated;
  }
}

export const storage = new MemStorage();

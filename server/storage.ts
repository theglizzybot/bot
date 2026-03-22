import { type Application, type InsertApplication } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getApplications(): Promise<Application[]>;
  getApplication(id: string): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: string, status: string): Promise<Application | undefined>;
  deleteApplication(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private applications: Map<string, Application>;

  constructor() {
    this.applications = new Map();
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
      status: "Neu",
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
}

export const storage = new MemStorage();

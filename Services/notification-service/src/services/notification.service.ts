import { NotificationRepository } from "../repositories/notification.repository";
import {
  CreateNotificationDTO,
  NotificationFilter,
  PaginatedResult,
} from "../types/notification.types";
import { INotification } from "../models/notification.model";

export class NotificationService {
  private readonly repo: NotificationRepository;

  constructor() {
    this.repo = new NotificationRepository();
  }

  async store(dto: CreateNotificationDTO): Promise<INotification> {
    this.validateCreateDTO(dto);
    return this.repo.store(dto);
  }

  async fetch(
    filter: NotificationFilter,
  ): Promise<PaginatedResult<INotification>> {
    return this.repo.fetch(filter);
  }

  async read(id: string, userId: string): Promise<INotification> {
    const notification = await this.repo.markAsRead(id, userId);
    if (!notification) {
      throw new Error(`Notification ${id} not found or unauthorized`);
    }
    return notification;
  }

  async markUnread(id: string, userId: string): Promise<INotification> {
    const notification = await this.repo.markAsUnread(id, userId);
    if (!notification) {
      throw new Error(`Notification ${id} not found or unauthorized`);
    }
    return notification;
  }

  async readAll(userId: string): Promise<{ updated: number }> {
    const updated = await this.repo.markAllAsRead(userId);
    return { updated };
  }

  async delete(id: string, userId: string): Promise<{ deleted: boolean }> {
    const deleted = await this.repo.delete(id, userId);
    if (!deleted) {
      throw new Error(`Notification ${id} not found or unauthorized`);
    }
    return { deleted };
  }

  async deleteAll(userId: string, type?: string): Promise<{ deleted: number }> {
    const deleted = await this.repo.deleteAll(userId, type);
    return { deleted };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.repo.countUnread(userId);
    return { count };
  }

  private validateCreateDTO(dto: CreateNotificationDTO): void {
    if (!dto.userId) throw new Error("userId is required");
    if (!dto.title) throw new Error("title is required");
    if (!dto.body) throw new Error("body is required");
    // if (!dto.type) throw new Error("type is required");
    // if (!dto.channel) throw new Error("channel is required");

    // const validChannels = ["push", "email", "sms", "in-app"];
    // if (!validChannels.includes(dto.channel)) {
    //   throw new Error(`Invalid channel: ${dto.channel}`);
    // }
  }
}

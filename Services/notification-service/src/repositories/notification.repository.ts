import { NotificationModel, INotification } from "../models/notification.model";
import {
  CreateNotificationDTO,
  NotificationFilter,
  PaginatedResult,
} from "../types/notification.types";

export class NotificationRepository {
  async store(dto: CreateNotificationDTO): Promise<INotification> {
    const notification = new NotificationModel({
      ...dto,
      status: "unread",
      priority: dto.priority ?? "medium",
    });
    return notification.save();
  }

  async findById(id: string): Promise<INotification | null> {
    return NotificationModel.findById(id).lean();
  }

  async fetch(
    filter: NotificationFilter,
  ): Promise<PaginatedResult<INotification>> {
    const {
      userId,
      status,
      // type,
      // channel,
      from,
      to,
      page = 1,
      limit = 20,
    } = filter;

    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;
    // if (type) query.type = type;
    // if (channel) query.channel = channel;
    if (from || to) {
      query.createdAt = {};
      if (from) (query.createdAt as Record<string, Date>).$gte = from;
      if (to) (query.createdAt as Record<string, Date>).$lte = to;
    }

    const skip = (page - 1) * limit;
    const total = await NotificationModel.countDocuments(query);

    const data = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate(
      { _id: id, userId },
      { status: "read", readAt: new Date() },
      { new: true },
    ).lean();
  }

  async markAsUnread(
    id: string,
    userId: string,
  ): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate(
      { _id: id, userId },
      { status: "unread", readAt: null },
      { new: true },
    ).lean();
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await NotificationModel.updateMany(
      { userId, status: "unread" },
      { status: "read", readAt: new Date() },
    );
    return result.modifiedCount;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await NotificationModel.deleteOne({ _id: id, userId });
    return result.deletedCount === 1;
  }

  async deleteAll(userId: string, type?: string): Promise<number> {
    const query: Record<string, string> = { userId };
    if (type) query.type = type;

    const result = await NotificationModel.deleteMany(query);
    return result.deletedCount;
  }

  async countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, status: "unread" });
  }
}

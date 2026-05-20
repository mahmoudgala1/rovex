import { BaseNotificationChannel } from "./base.channel";
import { NotificationChannel, ChannelResult } from "../types";
import { emitToUser } from "../socket/socket.server";
import { NotificationService } from "../services/notification.service";

export class SocketChannel extends BaseNotificationChannel {
  channelType = NotificationChannel.SOCKET;
  private notificationService;

  constructor() {
    super();
    this.notificationService = new NotificationService();
  }

  async send(
    recipient: string,
    data: any,
    metadata?: Record<string, any>,
  ): Promise<ChannelResult> {
    try {
      if (!recipient) {
        throw new Error("Recipient token is required for SocketChannel");
      }

      await this.notificationService.store({
        userId: data.userId,
        title: data.title,
        body: data.body,
        metadata: metadata,
      });

      emitToUser(recipient, "notification:new", {
        title: data.title,
        body: data.body,
        timestamp: metadata!.timestamp,
      });

      emitToUser(
        recipient,
        "notification:unread-count",
        await this.notificationService.getUnreadCount(data.userId),
      );

      return this.handleSuccess(recipient);
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}

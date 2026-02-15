import { NotificationChannel, ChannelResult } from "../types";

export abstract class BaseNotificationChannel {
  abstract channelType: NotificationChannel;

  abstract send(
    recipient: string,
    data: any,
    metadata?: Record<string, any>
  ): Promise<ChannelResult>;

  protected handleError(error: any): ChannelResult {
    return {
      success: false,
      channel: this.channelType,
      error: error.message || "Unknown error occurred",
    };
  }

  protected handleSuccess(messageId?: string): ChannelResult {
    return {
      success: true,
      channel: this.channelType,
      messageId,
    };
  }
}

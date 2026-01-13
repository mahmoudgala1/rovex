import { NotificationChannel, ChannelResult } from "../types";

export abstract class BaseNotificationChannel {
  abstract channelType: NotificationChannel;

  /**
   * Send notification through this channel
   */
  abstract send(
    recipient: string,
    data: any,
    metadata?: Record<string, any>
  ): Promise<ChannelResult>;

  /**
   * Handle error response
   */
  protected handleError(error: any): ChannelResult {
    return {
      success: false,
      channel: this.channelType,
      error: error.message || "Unknown error occurred",
    };
  }

  /**
   * Handle success response
   */
  protected handleSuccess(messageId?: string): ChannelResult {
    return {
      success: true,
      channel: this.channelType,
      messageId,
    };
  }
}

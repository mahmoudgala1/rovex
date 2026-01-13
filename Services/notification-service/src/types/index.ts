export enum NotificationChannel {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
}

export interface NotificationEvent {
  channels: NotificationChannel[];
  data: Record<string, any>;
  metadata?: {
    timestamp: string;
  };
}

export interface ChannelResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}

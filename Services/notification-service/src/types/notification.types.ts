export type NotificationStatus = "unread" | "read";
export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface Notification {
  userId: string;
  title: string;
  body: string;
  // type: string;
  // channel: NotificationChannel;
  status: NotificationStatus;
  priority: NotificationPriority;
  metadata?: Record<string, unknown>;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  body: string;
  // type: string;
  // channel: NotificationChannel;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilter {
  userId: string;
  status?: NotificationStatus;
  // type?: string;
  // channel?: NotificationChannel;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

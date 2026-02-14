import admin from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import { BaseNotificationChannel } from "./base.channel";
import { NotificationChannel, ChannelResult } from "../types";
import { env } from "../config/environment";

export class PushChannel extends BaseNotificationChannel {
  channelType = NotificationChannel.PUSH;
  private isInitialized = false;

  constructor() {
    super();
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    try {
      console.log(admin.apps.length);
      if (admin.apps.length > 0) {
        this.isInitialized = true;
        console.log("✅ Firebase Admin already initialized");
        return;
      }

      const projectId = env.FIREBASE_PROJECT_ID;
      const clientEmail = env.FIREBASE_CLIENT_EMAIL;
      const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      );

      if (!projectId || !clientEmail || !privateKey) {
        console.warn(
          "⚠️ Firebase credentials not configured. Push notifications disabled."
        );
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

      this.isInitialized = true;
      console.log("✅ Firebase Admin SDK initialized");
    } catch (error: any) {
      console.error("❌ Failed to initialize Firebase:", error.message);
    }
  }

  /**
   * Send push notification to single device
   */
  async send(
    recipient: string, // FCM token
    data: any,
    metadata?: Record<string, any>
  ): Promise<ChannelResult> {
    if (!this.isInitialized) {
      return this.handleError(new Error("Firebase not initialized"));
    }

    try {
      if (!recipient || recipient.length < 10) {
        throw new Error("Invalid FCM token");
      }

      const message = {
        notification: {
          title: data.title,
          body: data.body,
          imageUrl: data.imageUrl,
        },
        data: data.data || {},
        token: recipient,
        android: {
          priority: "high" as const,
          notification: {
            channelId: "rovex_notifications",
            sound: "default",
            priority: "high" as const,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const messageId = await getMessaging().send(message);

      console.log(`🔔 Push notification sent: ${messageId}`);
      return this.handleSuccess(messageId);
    } catch (error: any) {
      console.error(`❌ Push notification failed:`, error.message);

      if (
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        console.warn(`⚠️ Invalid/expired FCM token: ${recipient}`);
      }

      return this.handleError(error);
    }
  }

  /**
   * Send to multiple tokens (up to 500 tokens per call)
   */
  async sendToMultiple(
    tokens: string[],
    data: any,
    metadata?: Record<string, any>
  ): Promise<ChannelResult> {
    if (!this.isInitialized) {
      return this.handleError(new Error("Firebase not initialized"));
    }

    try {
      // Firebase recommends max 500 tokens, but use 100 for better reliability
      if (tokens.length > 500) {
        console.warn(
          `⚠️ Token count (${tokens.length}) exceeds limit. Splitting into batches.`
        );
        return await this.sendInBatches(tokens, data, metadata);
      }

      const message = {
        notification: {
          title: data.title,
          body: data.body,
        },
        data: data.data || {},
        tokens: tokens, // Array of FCM tokens
      };

      // Use sendEachForMulticast instead of sendMulticast
      const response = await getMessaging().sendEachForMulticast(message);

      console.log(
        `🔔 Push notifications: ${response.successCount}/${tokens.length} successful`
      );

      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.error(`  ✗ Token ${idx}: ${resp.error?.message}`);
          }
        });
        console.warn(`⚠️ Failed tokens:`, failedTokens);
      }

      return this.handleSuccess(`${response.successCount}/${tokens.length}`);
    } catch (error: any) {
      console.error("❌ Multicast push notification failed:", error.message);
      return this.handleError(error);
    }
  }

  /**
   * Send in batches for large token lists
   */
  private async sendInBatches(
    tokens: string[],
    data: any,
    metadata?: Record<string, any>
  ): Promise<ChannelResult> {
    const BATCH_SIZE = 100; // Recommended batch size
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);

      const message = {
        notification: {
          title: data.title,
          body: data.body,
        },
        data: data.data || {},
        tokens: batch,
      };

      try {
        const response = await getMessaging().sendEachForMulticast(message);
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        console.log(
          `  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${
            response.successCount
          }/${batch.length} successful`
        );
      } catch (error: any) {
        console.error(
          `  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`,
          error.message
        );
        totalFailure += batch.length;
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < tokens.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `🔔 Total: ${totalSuccess}/${tokens.length} notifications sent`
    );
    return this.handleSuccess(`${totalSuccess}/${tokens.length}`);
  }

  /**
   * Send to topic (broadcast to all subscribed users)
   */
  async sendToTopic(
    topic: string,
    data: any,
    metadata?: Record<string, any>
  ): Promise<ChannelResult> {
    if (!this.isInitialized) {
      return this.handleError(new Error("Firebase not initialized"));
    }

    try {
      const message = {
        notification: {
          title: data.title,
          body: data.body,
        },
        data: data.data || {},
        topic: topic,
      };

      const messageId = await getMessaging().send(message);

      console.log(
        `🔔 Push notification sent to topic "${topic}": ${messageId}`
      );
      return this.handleSuccess(messageId);
    } catch (error: any) {
      console.error(`❌ Topic push notification failed:`, error.message);
      return this.handleError(error);
    }
  }

  /**
   * Subscribe tokens to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Firebase not initialized");
    }

    try {
      const response = await getMessaging().subscribeToTopic(tokens, topic);
      console.log(
        `✅ ${response.successCount} tokens subscribed to topic: ${topic}`
      );

      if (response.failureCount > 0) {
        console.warn(`⚠️ ${response.failureCount} tokens failed to subscribe`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to subscribe to topic:`, error.message);
      throw error;
    }
  }
}

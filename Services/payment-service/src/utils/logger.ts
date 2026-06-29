export class Logger {
  constructor(private context: string) {}

  info(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [INFO] [${this.context}] ${message}`,
      meta || "",
    );
  }

  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(
      `[${timestamp}] [ERROR] [${this.context}] ${message}`,
      error || "",
    );
  }

  warn(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] [WARN] [${this.context}] ${message}`,
      meta || "",
    );
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === "development") {
      const timestamp = new Date().toISOString();
      console.debug(
        `[${timestamp}] [DEBUG] [${this.context}] ${message}`,
        meta || "",
      );
    }
  }

  webhook(event: string, userId?: string) {
    console.log(`[WEBHOOK] ${event} | userId=${userId ?? "unknown"}`);
  }
}

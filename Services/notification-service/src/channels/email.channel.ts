import nodemailer, { Transporter } from "nodemailer";
import { BaseNotificationChannel } from "./base.channel";
import { NotificationChannel, ChannelResult } from "../types";
import fs from "fs";
import path from "path";
import { env } from "../config/environment";

const isDevelopment = process.env.NODE_ENV !== "production";
export class EmailChannel extends BaseNotificationChannel {
  channelType = NotificationChannel.EMAIL;
  private transporter: Transporter;
  private templatesPath: string;

  constructor() {
    super();

    this.templatesPath = path.join(process.cwd(), `${isDevelopment ? "src" : "dist"}/templates/emails`);
    console.log(this.templatesPath);
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });

    this.transporter.verify((error, success) => {
      if (error) {
        console.error("SMTP connection error:", error);
      } else {
        console.log("SMTP server is ready to send emails");
      }
    });
  }

  async send(
    recipient: string,
    data: any,
    metadata?: Record<string, any>,
  ): Promise<ChannelResult> {
    try {
      let htmlContent = "";

      if (data.template) {
        htmlContent = await this.renderTemplate(
          data.template,
          data.theme,
          data.data,
        );
      }

      const mailOptions = {
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM || env.SMTP_USER}>`,
        to: recipient,
        subject: data.subject,
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`Email sent to ${recipient}: ${info.messageId}`);
      return this.handleSuccess(info.messageId);
    } catch (error: any) {
      console.error(`Email failed to ${recipient}:`, error.message);
      return this.handleError(error);
    }
  }

  private renderTemplate(
    templateName: string,
    theme: string,
    data: Record<string, any>,
  ): string {
    try {
      const templatePath = path.join(
        this.templatesPath,
        `${templateName}.html`,
      );
      let template = fs.readFileSync(templatePath, "utf-8");

      const isDark = theme === "dark";
      template = template.replace(
        /\{\{#if_dark\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if_dark\}\}/g,
        (match, darkContent, lightContent) => {
          return isDark ? darkContent.trim() : lightContent.trim();
        },
      );

      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        template = template.replace(regex, data[key] || "");
      });

      return template;
    } catch (error) {
      throw new Error(`Email template not found: ${templateName}`);
    }
  }
}

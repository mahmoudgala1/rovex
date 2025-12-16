import nodemailer from "nodemailer";
import twilio from "twilio";
import { env } from "../config/environment";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";


interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

class NotificationService {
  private transporter: nodemailer.Transporter;
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(__dirname, "../templates/emails");

    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const html = this.loadTemplate(options.template, options.data);

      const mailOptions = {
        from: `"ROVEX Fleet Platform" <${env.SMTP_FROM || env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent successfully to ${options.to}`);
    } catch (error) {
      logger.error("Failed to send email:", error);
      throw error;
    }
  }

  private loadTemplate(
    templateName: string,
    data: Record<string, any>
  ): string {
    try {
      const templatePath = path.join(
        this.templatesPath,
        `${templateName}.html`
      );
      let template = fs.readFileSync(templatePath, "utf-8");

      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        template = template.replace(regex, data[key] || "");
      });

      return template;
    } catch (error) {
      logger.error(`Failed to load email template: ${templateName}`, error);
      throw new Error(`Email template not found: ${templateName}`);
    }
  }
}

export default new NotificationService();

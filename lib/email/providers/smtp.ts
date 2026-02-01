import { EmailProvider, EmailOptions, EmailConfig } from '../index';

export class SMTPProvider implements EmailProvider {
  name = 'SMTP';
  private host: string;
  private port: number;
  private user: string;
  private pass: string;
  private secure: boolean;
  private fromEmail: string;
  private fromName?: string;

  constructor(config: EmailConfig) {
    this.host = config.smtpHost || '';
    this.port = config.smtpPort || 587;
    this.user = config.smtpUser || '';
    this.pass = config.smtpPass || '';
    this.secure = config.smtpSecure || false;
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Dynamic import nodemailer - wrapped to catch module not found
      let nodemailer: any;
      try {
        nodemailer = await import('nodemailer');
      } catch {
        return {
          success: false,
          error: 'Nodemailer not installed. Run: npm install nodemailer',
        };
      }

      const transporter = nodemailer.default.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.user,
          pass: this.pass,
        },
      });

      const from = this.fromName ? `${this.fromName} <${this.fromEmail}>` : this.fromEmail;

      const result = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

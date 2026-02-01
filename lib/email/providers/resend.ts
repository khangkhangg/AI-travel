import { EmailProvider, EmailOptions, EmailConfig } from '../index';

export class ResendProvider implements EmailProvider {
  name = 'Resend';
  private apiKey: string;
  private fromEmail: string;
  private fromName?: string;

  constructor(config: EmailConfig) {
    this.apiKey = config.apiKey || '';
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const from = this.fromName ? `${this.fromName} <${this.fromEmail}>` : this.fromEmail;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Resend API error' };
      }

      return { success: true, messageId: data.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

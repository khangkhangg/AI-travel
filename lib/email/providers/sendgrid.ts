import { EmailProvider, EmailOptions, EmailConfig } from '../index';

export class SendGridProvider implements EmailProvider {
  name = 'SendGrid';
  private apiKey: string;
  private fromEmail: string;
  private fromName?: string;

  constructor(config: EmailConfig) {
    this.apiKey = config.apiKey || '';
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          subject: options.subject,
          content: [
            ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
            { type: 'text/html', value: options.html },
          ],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data.errors?.[0]?.message || 'SendGrid API error' };
      }

      // SendGrid returns message ID in header
      const messageId = response.headers.get('x-message-id') || undefined;
      return { success: true, messageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

import { EmailProvider, EmailOptions, EmailConfig } from '../index';

export class SESProvider implements EmailProvider {
  name = 'AWS SES';
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private fromEmail: string;
  private fromName?: string;

  constructor(config: EmailConfig) {
    this.region = config.awsRegion || 'us-east-1';
    this.accessKeyId = config.awsAccessKeyId || '';
    this.secretAccessKey = config.awsSecretKey || '';
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // AWS SES requires AWS SDK - try to load it dynamically
    try {
      let SESClient: any, SendEmailCommand: any;
      try {
        const ses = await import('@aws-sdk/client-ses');
        SESClient = ses.SESClient;
        SendEmailCommand = ses.SendEmailCommand;
      } catch {
        return {
          success: false,
          error: 'AWS SES SDK not installed. Run: npm install @aws-sdk/client-ses',
        };
      }

      const client = new SESClient({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const from = this.fromName ? `${this.fromName} <${this.fromEmail}>` : this.fromEmail;

      const command = new SendEmailCommand({
        Source: from,
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Subject: { Data: options.subject },
          Body: {
            Html: { Data: options.html },
            ...(options.text ? { Text: { Data: options.text } } : {}),
          },
        },
      });

      const result = await client.send(command);
      return { success: true, messageId: result.MessageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

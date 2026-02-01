// Email abstraction layer with multiple provider support
// Providers: Resend, SendGrid, AWS SES, SMTP

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  name: string;
  send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface EmailConfig {
  provider: 'disabled' | 'resend' | 'sendgrid' | 'ses' | 'smtp';
  fromEmail: string;
  fromName?: string;
  // Provider-specific config
  apiKey?: string;          // Resend, SendGrid
  awsRegion?: string;       // SES
  awsAccessKeyId?: string;  // SES
  awsSecretKey?: string;    // SES
  smtpHost?: string;        // SMTP
  smtpPort?: number;        // SMTP
  smtpUser?: string;        // SMTP
  smtpPass?: string;        // SMTP
  smtpSecure?: boolean;     // SMTP
}

// Get email configuration from environment
export function getEmailConfig(): EmailConfig {
  return {
    provider: (process.env.EMAIL_PROVIDER as EmailConfig['provider']) || 'disabled',
    fromEmail: process.env.EMAIL_FROM || 'noreply@example.com',
    fromName: process.env.EMAIL_FROM_NAME || 'AI Travel',
    apiKey: process.env.EMAIL_API_KEY,
    awsRegion: process.env.AWS_SES_REGION,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpSecure: process.env.SMTP_SECURE === 'true',
  };
}

// Check if email is configured
export function isEmailConfigured(): boolean {
  const config = getEmailConfig();
  if (config.provider === 'disabled') return false;

  switch (config.provider) {
    case 'resend':
    case 'sendgrid':
      return !!config.apiKey;
    case 'ses':
      return !!config.awsRegion && !!config.awsAccessKeyId && !!config.awsSecretKey;
    case 'smtp':
      return !!config.smtpHost && !!config.smtpUser && !!config.smtpPass;
    default:
      return false;
  }
}

// Get the configured email provider
export async function getEmailProvider(): Promise<EmailProvider | null> {
  const config = getEmailConfig();

  if (!isEmailConfigured()) {
    return null;
  }

  switch (config.provider) {
    case 'resend':
      const { ResendProvider } = await import('./providers/resend');
      return new ResendProvider(config);
    case 'sendgrid':
      const { SendGridProvider } = await import('./providers/sendgrid');
      return new SendGridProvider(config);
    case 'ses':
      const { SESProvider } = await import('./providers/ses');
      return new SESProvider(config);
    case 'smtp':
      const { SMTPProvider } = await import('./providers/smtp');
      return new SMTPProvider(config);
    default:
      return null;
  }
}

// Send an email using the configured provider
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = await getEmailProvider();

  if (!provider) {
    return { success: false, error: 'Email not configured' };
  }

  try {
    return await provider.send(options);
  } catch (error: any) {
    console.error(`Email send failed with ${provider.name}:`, error);
    return { success: false, error: error.message };
  }
}

// Send a trip invite email
export async function sendInviteEmail(params: {
  to: string;
  inviteUrl: string;
  tripTitle: string;
  tripCity?: string;
  inviterName?: string;
  role: string;
}): Promise<{ success: boolean; error?: string }> {
  const config = getEmailConfig();
  const roleDescription = params.role === 'editor'
    ? 'edit the itinerary and manage activities'
    : 'view the trip details and follow along';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #2563eb; margin-bottom: 8px;">You're Invited!</h1>
      </div>

      <p style="font-size: 16px;">Hey!</p>

      <p style="font-size: 16px;">
        <strong>${params.inviterName || 'Someone'}</strong> wants you to help plan their trip${params.tripCity ? ` to <strong>${params.tripCity}</strong>` : ''}.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.inviteUrl}"
           style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Trip: ${params.tripTitle || 'Untitled Trip'}
        </a>
      </div>

      <p style="font-size: 14px; color: #666;">
        You've been invited as a <strong>${params.role}</strong> - you can ${roleDescription}.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        This link expires in 7 days. If you didn't expect this invite, you can ignore this email.
      </p>
    </body>
    </html>
  `;

  const text = `
You're Invited!

${params.inviterName || 'Someone'} wants you to help plan their trip${params.tripCity ? ` to ${params.tripCity}` : ''}.

View Trip: ${params.inviteUrl}

You've been invited as a ${params.role} - you can ${roleDescription}.

---
This link expires in 7 days.
  `.trim();

  return sendEmail({
    to: params.to,
    subject: `${params.inviterName || 'Someone'} invited you to collaborate on "${params.tripTitle || 'a trip'}"`,
    html,
    text,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// POST - send a test email
export async function POST(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      provider,
      emailFrom,
      emailFromName,
      emailApiKey,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      awsSesRegion,
      awsAccessKeyId,
      awsSecretKey,
      testEmail
    } = body;

    if (!testEmail) {
      return NextResponse.json({ error: 'Test email address required' }, { status: 400 });
    }

    if (!provider || provider === 'disabled') {
      return NextResponse.json({ error: 'Email provider not configured' }, { status: 400 });
    }

    // Build email options
    const emailOptions = {
      to: testEmail,
      subject: 'Test Email from AI Travel',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; text-align: center;">
            <h1 style="color: #10b981;">Email Configuration Works!</h1>
            <p style="color: #6b7280; font-size: 16px;">
              Your email settings are correctly configured.
            </p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #374151; font-size: 14px;">
                <strong>Provider:</strong> ${provider}<br>
                <strong>From:</strong> ${emailFromName ? `${emailFromName} <${emailFrom}>` : emailFrom}
              </p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
              Sent from AI Travel Admin Panel
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Email Configuration Works!\n\nYour email settings are correctly configured.\n\nProvider: ${provider}\nFrom: ${emailFrom}`,
    };

    let result: { success: boolean; messageId?: string; error?: string };

    // Send based on provider
    switch (provider) {
      case 'resend':
        result = await sendViaResend(emailApiKey, emailFrom, emailFromName, emailOptions);
        break;
      case 'sendgrid':
        result = await sendViaSendGrid(emailApiKey, emailFrom, emailFromName, emailOptions);
        break;
      case 'ses':
        result = await sendViaSES(awsSesRegion, awsAccessKeyId, awsSecretKey, emailFrom, emailFromName, emailOptions);
        break;
      case 'smtp':
        result = await sendViaSMTP(smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, emailFrom, emailFromName, emailOptions);
        break;
      default:
        return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        messageId: result.messageId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send test email'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Test email failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send test email'
    }, { status: 500 });
  }
}

// Resend provider
async function sendViaResend(
  apiKey: string,
  fromEmail: string,
  fromName: string | undefined,
  options: { to: string; subject: string; html: string; text: string }
) {
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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

// SendGrid provider
async function sendViaSendGrid(
  apiKey: string,
  fromEmail: string,
  fromName: string | undefined,
  options: { to: string; subject: string; html: string; text: string }
) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: options.subject,
        content: [
          { type: 'text/plain', value: options.text },
          { type: 'text/html', value: options.html },
        ],
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.errors?.[0]?.message || 'SendGrid API error' };
    }

    const messageId = response.headers.get('x-message-id') || undefined;
    return { success: true, messageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// AWS SES provider
async function sendViaSES(
  region: string,
  accessKeyId: string,
  secretKey: string,
  fromEmail: string,
  fromName: string | undefined,
  options: { to: string; subject: string; html: string; text: string }
) {
  try {
    let SESClient: any, SendEmailCommand: any;
    try {
      const ses = await import('@aws-sdk/client-ses');
      SESClient = ses.SESClient;
      SendEmailCommand = ses.SendEmailCommand;
    } catch {
      return { success: false, error: 'AWS SES SDK not installed. Run: npm install @aws-sdk/client-ses' };
    }

    const client = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey: secretKey,
      },
    });

    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: { Data: options.subject },
        Body: {
          Html: { Data: options.html },
          Text: { Data: options.text },
        },
      },
    });

    const result = await client.send(command);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// SMTP provider
async function sendViaSMTP(
  host: string,
  port: number,
  user: string,
  pass: string,
  secure: boolean,
  fromEmail: string,
  fromName: string | undefined,
  options: { to: string; subject: string; html: string; text: string }
) {
  try {
    let nodemailer: any;
    try {
      nodemailer = await import('nodemailer');
    } catch {
      return { success: false, error: 'Nodemailer not installed. Run: npm install nodemailer' };
    }

    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

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

// Type declarations for optional modules
// These modules are dynamically imported with try-catch, so they're optional

declare module '@aws-sdk/client-ses' {
  export class SESClient {
    constructor(config: { region: string; credentials?: { accessKeyId: string; secretAccessKey: string } });
    send(command: any): Promise<any>;
  }

  export class SendEmailCommand {
    constructor(input: {
      Destination: { ToAddresses: string[] };
      Message: {
        Body: { Html?: { Charset: string; Data: string }; Text?: { Charset: string; Data: string } };
        Subject: { Charset: string; Data: string };
      };
      Source: string;
    });
  }
}

declare module 'nodemailer' {
  interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
  }

  interface Transporter {
    sendMail(options: {
      from: string;
      to: string;
      subject: string;
      text?: string;
      html?: string;
    }): Promise<{ messageId: string }>;
  }

  export function createTransport(options: TransportOptions): Transporter;
}

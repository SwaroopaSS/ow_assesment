import nodemailer, { type Transporter } from 'nodemailer';
import { EmailDeliveryError, type EmailMessage, type EmailProvider } from './emailProvider';

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

/** Works with any SMTP relay, including AWS SES SMTP. */
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter;

  constructor(private readonly options: SmtpOptions) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: options.user ? { user: options.user, pass: options.pass } : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.options.from, ...message });
    } catch (cause) {
      throw new EmailDeliveryError('Could not deliver email', { cause });
    }
  }
}

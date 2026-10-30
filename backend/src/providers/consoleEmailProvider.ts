import type { EmailMessage, EmailProvider } from './emailProvider';

export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log('[email:console]', JSON.stringify(message, null, 2));
  }
}

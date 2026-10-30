import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EmailDeliveryError, type EmailMessage, type EmailProvider } from './emailProvider';

/**
 * Local "sales inbox": each email is written as a text file in a folder.
 * Needs no server or account, so a reviewer can open the file to see the email.
 */
export class FileEmailProvider implements EmailProvider {
  constructor(private readonly dir: string) {}

  async send(message: EmailMessage): Promise<void> {
    try {
      await mkdir(this.dir, { recursive: true });
      const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}.txt`;
      const headers = [`To: ${message.to}`, message.replyTo ? `Reply-To: ${message.replyTo}` : '', `Subject: ${message.subject}`];
      await writeFile(path.join(this.dir, name), `${headers.filter(Boolean).join('\n')}\n\n${message.text}\n`, 'utf8');
    } catch (cause) {
      throw new EmailDeliveryError('Could not write email to the outbox', { cause });
    }
  }
}

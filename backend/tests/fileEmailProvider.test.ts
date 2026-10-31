import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EmailDeliveryError } from '../src/providers/emailProvider';
import { FileEmailProvider } from '../src/providers/fileEmailProvider';

describe('FileEmailProvider', () => {
  it('writes each email to its own file with recipient, subject and body', async () => {
    const dir = path.join(mkdtempSync(path.join(os.tmpdir(), 'outbox-')), 'nested');
    const provider = new FileEmailProvider(dir);
    await provider.send({ to: 'sales@x.test', replyTo: 'ada@x.test', subject: 'Hi', text: 'Body' });
    await provider.send({ to: 'sales@x.test', subject: 'Again', text: 'Body 2' });

    const files = readdirSync(dir);
    expect(files).toHaveLength(2);
    const first = files.map((f) => readFileSync(path.join(dir, f), 'utf8')).find((c) => c.includes('Subject: Hi'))!;
    expect(first).toContain('To: sales@x.test');
    expect(first).toContain('Reply-To: ada@x.test');
    expect(first).toContain('Body');
  });

  it('reports failure as EmailDeliveryError', async () => {
    await expect(new FileEmailProvider(path.join(__filename, 'x')).send({ to: 'a', subject: 's', text: 't' }))
      .rejects.toBeInstanceOf(EmailDeliveryError);
  });
});

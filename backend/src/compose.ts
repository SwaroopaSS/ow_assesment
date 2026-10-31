import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Config } from './config';
import { createApp } from './app';
import { ConsoleEmailProvider } from './providers/consoleEmailProvider';
import type { EmailProvider } from './providers/emailProvider';
import { FileEmailProvider } from './providers/fileEmailProvider';
import { FakeStoreProvider } from './providers/fakeStoreProvider';
import type { ProductProvider } from './providers/productProvider';
import { SmtpEmailProvider } from './providers/smtpEmailProvider';
import { CatalogueService } from './services/catalogueService';
import { EnquiryService } from './services/enquiryService';

/** Composition root: the only place that picks concrete implementations from config. */
export function buildApp(config: Config) {
  const products: ProductProvider = new FakeStoreProvider({ baseUrl: config.FAKESTORE_BASE_URL });

  const email: EmailProvider = buildEmail(config);

  // Serve the built client from the same origin when it exists (no CORS or proxy needed).
  const staticDir = path.resolve(config.STATIC_DIR);
  const hasClient = existsSync(path.join(staticDir, 'index.html'));
  if (!hasClient) console.warn(`Client build not found at ${staticDir}; serving the API only.`);

  const catalogue = new CatalogueService(products, {
    featuredIds: config.FEATURED_PRODUCT_IDS,
    categoryTopRatedCount: config.CATEGORY_TOP_RATED_COUNT,
    cacheTtlMs: config.PRODUCT_CACHE_TTL_SECONDS * 1000,
  });

  return createApp({
    catalogue,
    enquiries: new EnquiryService(email, config.SALES_INBOX),
    corsOrigins: config.CORS_ORIGINS,
    staticDir: hasClient ? staticDir : undefined,
  });
}

function buildEmail(config: Config): EmailProvider {
  switch (config.EMAIL_PROVIDER) {
    case 'smtp':
      return new SmtpEmailProvider({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        user: config.SMTP_USER || undefined,
        pass: config.SMTP_PASS || undefined,
        from: config.EMAIL_FROM,
      });
    case 'console':
      return new ConsoleEmailProvider();
    case 'file':
      return new FileEmailProvider(path.resolve(config.OUTBOX_DIR));
  }
}

import { z } from 'zod';

const csv = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);

const schema = z.object({
  PORT: z.coerce.number().int().default(4000),
  CORS_ORIGINS: z.string().default('').transform(csv),
  PRODUCT_PROVIDER: z.enum(['fakestore']).default('fakestore'),
  FAKESTORE_BASE_URL: z.string().url().default('https://fakestoreapi.com'),
  PRODUCT_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(300),
  FEATURED_PRODUCT_IDS: z.string().default('3,6,9,12,15').transform(csv),
  CATEGORY_TOP_RATED_COUNT: z.coerce.number().int().min(1).default(3),
  EMAIL_PROVIDER: z.enum(['file', 'smtp', 'console']).default('file'),
  OUTBOX_DIR: z.string().default('./outbox'),
  STATIC_DIR: z.string().default('../frontend/dist'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().default(1025),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('catalogue@example.test'),
  SALES_INBOX: z.string().email().default('sales@example.test'),
});

export type Config = z.infer<typeof schema>;

/** Fails fast at startup with a readable message if configuration is wrong. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ');
    throw new Error(`Invalid configuration:\n  ${issues}`);
  }
  return parsed.data;
}

import path from 'node:path';
import cors from 'cors';
import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { errorHandler, NotFoundError } from './middleware/errors';
import type { CatalogueService } from './services/catalogueService';
import { enquirySchema, type EnquiryService } from './services/enquiryService';

export interface AppDeps {
  catalogue: CatalogueService;
  enquiries: EnquiryService;
  corsOrigins?: string[];
  /** Absolute path of the built client. When set, it is served with an SPA fallback. */
  staticDir?: string;
  enquiryRateLimit?: { windowMs: number; limit: number };
}

// Express 4 doesn't forward async rejections; this wrapper does.
const wrap =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export function createApp({ catalogue, enquiries, corsOrigins = [], enquiryRateLimit, staticDir }: AppDeps) {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Product images come from whatever the product source uses, so allow any https image.
          'img-src': ["'self'", 'data:', 'https:'],
          // Plain http://localhost would otherwise have its assets upgraded to https.
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: '10kb' }));

  const api = express.Router();

  api.get('/health', (_req, res) => void res.json({ status: 'ok' }));

  api.get('/products/featured', wrap(async (_req, res) => {
    res.json({ products: await catalogue.featured() });
  }));

  api.get('/products', wrap(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    res.json({ query: q, products: await catalogue.search(q) });
  }));

  api.get('/products/:id', wrap(async (req, res) => {
    const product = await catalogue.get(req.params.id!);
    if (!product) throw new NotFoundError('Product not found');
    res.json({ product });
  }));

  api.get('/categories', wrap(async (_req, res) => {
    res.json({ categories: await catalogue.categories() });
  }));

  api.get('/categories/:slug', wrap(async (req, res) => {
    const page = await catalogue.categoryPage(req.params.slug!);
    if (!page) throw new NotFoundError('Category not found');
    res.json(page);
  }));

  api.post(
    '/enquiries',
    rateLimit({
      windowMs: enquiryRateLimit?.windowMs ?? 60_000,
      limit: enquiryRateLimit?.limit ?? 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'rate_limited', message: 'Too many enquiries. Please try again shortly.' },
    }),
    wrap(async (req, res) => {
      const input = enquirySchema.parse(req.body);
      const product = await catalogue.get(input.productId);
      if (!product) throw new NotFoundError('Product not found');
      await enquiries.submit(input, product);
      res.status(202).json({ status: 'received' });
    }),
  );

  app.use('/api', api);
  app.use('/api', (_req, _res, next) => next(new NotFoundError('Route not found')));
  if (staticDir) {
    app.use(express.static(staticDir));
    // Client-side routes (/products/3, /search?q=..) must load the app shell on refresh.
    app.get('*', (_req, res) => void res.sendFile(path.join(staticDir, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}

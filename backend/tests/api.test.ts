import request from 'supertest';
import { createApp } from '../src/app';
import { ProductSourceError, type ProductProvider } from '../src/providers/productProvider';
import { CatalogueService } from '../src/services/catalogueService';
import { EnquiryService } from '../src/services/enquiryService';
import { FakeEmail, FakeProvider } from './fixtures';

let email: FakeEmail;
const build = (provider: ProductProvider = new FakeProvider(), limit = 100, staticDir?: string) => {
  email = new FakeEmail();
  return createApp({
    catalogue: new CatalogueService(provider, { featuredIds: ['1', '2', '3', '4', '5'], categoryTopRatedCount: 2, cacheTtlMs: 0 }),
    enquiries: new EnquiryService(email, 'sales@test.dev'),
    enquiryRateLimit: { windowMs: 60_000, limit },
    staticDir,
  });
};
const valid = { productId: '1', name: 'Ada', email: 'ada@example.com', phone: '', message: 'Is it in stock?' };

beforeEach(() => void jest.spyOn(console, 'error').mockImplementation(() => {}));

describe('browse endpoints', () => {
  it('GET /api/products/featured returns the curated products', async () => {
    const res = await request(build()).get('/api/products/featured').expect(200);
    expect(res.body.products).toHaveLength(5);
  });

  it('GET /api/categories/:slug returns top rated plus additional products', async () => {
    const res = await request(build()).get('/api/categories/jewelery').expect(200);
    expect(res.body.topRated.map((p: { id: string }) => p.id)).toEqual(['3', '2']);
    expect(res.body.others).toHaveLength(2);
  });

  it('unknown category is 404', async () => {
    await request(build()).get('/api/categories/nope').expect(404);
  });

  it('GET /api/products?q= returns only matching products', async () => {
    const res = await request(build()).get('/api/products?q=necklace').expect(200);
    expect(res.body.products.map((p: { id: string }) => p.id)).toEqual(['3']);
  });

  it('GET /api/products/:id returns details, 404 when missing', async () => {
    const app = build();
    expect((await request(app).get('/api/products/2').expect(200)).body.product.title).toBe('Silver Ring');
    await request(app).get('/api/products/zzz').expect(404);
  });

  it('returns a safe 502 when the product source is down', async () => {
    const down: ProductProvider = { listProducts: async () => { throw new ProductSourceError('boom'); } };
    const res = await request(build(down)).get('/api/products/featured').expect(502);
    expect(res.body.error).toBe('catalogue_unavailable');
  });
});

describe('POST /api/enquiries', () => {
  it('emails the sales inbox with product and customer details', async () => {
    await request(build()).post('/api/enquiries').send(valid).expect(202);
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]).toMatchObject({ to: 'sales@test.dev', replyTo: 'ada@example.com' });
    expect(email.sent[0]!.subject).toContain('Gold Ring');
    expect(email.sent[0]!.text).toContain('Is it in stock?');
  });

  it('rejects invalid input with field errors and sends nothing', async () => {
    const res = await request(build()).post('/api/enquiries').send({ ...valid, email: 'nope', name: '' }).expect(400);
    expect(res.body.fields).toHaveProperty('email');
    expect(res.body.fields).toHaveProperty('name');
    expect(email.sent).toHaveLength(0);
  });

  it('404s for an unknown product', async () => {
    await request(build()).post('/api/enquiries').send({ ...valid, productId: 'zzz' }).expect(404);
  });

  it('surfaces email delivery failure as 502 so the customer is not told "thank you"', async () => {
    const app = build();
    email.fail = true;
    const res = await request(app).post('/api/enquiries').send(valid).expect(502);
    expect(res.body.error).toBe('email_failed');
  });

  it('keeps the subject on one line even with hostile customer input', async () => {
    await request(build()).post('/api/enquiries').send({ ...valid, name: 'x\r\nBcc: evil@x.com' }).expect(202);
    expect(email.sent[0]!.subject).not.toMatch(/[\r\n]/);
  });

  it('rate limits repeated submissions', async () => {
    const app = build(new FakeProvider(), 2);
    await request(app).post('/api/enquiries').send(valid).expect(202);
    await request(app).post('/api/enquiries').send(valid).expect(202);
    await request(app).post('/api/enquiries').send(valid).expect(429);
  });
});


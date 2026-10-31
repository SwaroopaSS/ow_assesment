import { z } from 'zod';
import { slugify, type Product } from '../domain/product';
import { ProductSourceError, type ProductProvider } from './productProvider';

const upstreamProduct = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.string(),
  image: z.string(),
  rating: z.object({ rate: z.number(), count: z.number() }).default({ rate: 0, count: 0 }),
});

export interface FakeStoreOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class FakeStoreProvider implements ProductProvider {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: FakeStoreOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async listProducts(): Promise<Product[]> {
    let body: unknown;
    try {
      const res = await this.fetchImpl(`${this.options.baseUrl}/products`, {
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 8000),
      });
      if (!res.ok) throw new Error(`Upstream responded ${res.status}`);
      body = await res.json();
    } catch (cause) {
      throw new ProductSourceError('Product source is unavailable', { cause });
    }

    const parsed = z.array(upstreamProduct).safeParse(body);
    if (!parsed.success) {
      throw new ProductSourceError('Product source returned unexpected data', { cause: parsed.error });
    }

    return parsed.data.map((p) => ({
      id: String(p.id),
      title: p.title,
      description: p.description,
      price: p.price,
      currency: 'USD',
      image: p.image,
      category: { slug: slugify(p.category), name: p.category },
      rating: p.rating,
    }));
  }
}

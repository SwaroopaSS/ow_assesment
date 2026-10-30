import type { Category, CategoryPage, Product } from '../domain/product';
import type { ProductProvider } from '../providers/productProvider';

export interface CatalogueOptions {
  featuredIds: string[];
  categoryTopRatedCount: number;
  cacheTtlMs: number;
  now?: () => number;
}

/** Business rules for browsing the catalogue. Knows nothing about HTTP or any upstream API. */
export class CatalogueService {
  private cache: { at: number; products: Product[] } | null = null;
  private readonly now: () => number;

  constructor(
    private readonly provider: ProductProvider,
    private readonly options: CatalogueOptions,
  ) {
    this.now = options.now ?? Date.now;
  }

  private async all(): Promise<Product[]> {
    const fresh = this.cache && this.now() - this.cache.at < this.options.cacheTtlMs;
    if (!fresh) {
      this.cache = { at: this.now(), products: await this.provider.listProducts() };
    }
    return this.cache!.products;
  }

  /** The curated "top rated" selection, in the configured order. Unknown ids are skipped. */
  async featured(): Promise<Product[]> {
    const products = await this.all();
    const byId = new Map(products.map((p) => [p.id, p]));
    return this.options.featuredIds.flatMap((id) => byId.get(id) ?? []);
  }

  async categories(): Promise<Category[]> {
    const seen = new Map<string, Category>();
    for (const p of await this.all()) seen.set(p.category.slug, p.category);
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Top rated = highest rating, ties broken by number of reviews. The rest keep source order. */
  async categoryPage(slug: string): Promise<CategoryPage | null> {
    const inCategory = (await this.all()).filter((p) => p.category.slug === slug);
    const category = inCategory[0]?.category;
    if (!category) return null;

    const ranked = [...inCategory].sort(
      (a, b) => b.rating.rate - a.rating.rate || b.rating.count - a.rating.count,
    );
    const topRated = ranked.slice(0, this.options.categoryTopRatedCount);
    const topIds = new Set(topRated.map((p) => p.id));
    return { category, topRated, others: inCategory.filter((p) => !topIds.has(p.id)) };
  }

  /** Case-insensitive match on title, description and category name; every term must match. */
  async search(query: string): Promise<Product[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return (await this.all()).filter((p) => {
      const haystack = `${p.title} ${p.description} ${p.category.name}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }

  async get(id: string): Promise<Product | null> {
    return (await this.all()).find((p) => p.id === id) ?? null;
  }
}

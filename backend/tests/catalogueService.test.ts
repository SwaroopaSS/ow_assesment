import { CatalogueService } from '../src/services/catalogueService';
import { FakeProvider } from './fixtures';

const make = (opts: Partial<ConstructorParameters<typeof CatalogueService>[1]> = {}, provider = new FakeProvider()) =>
  ({ provider, svc: new CatalogueService(provider, { featuredIds: ['5', '1', '999'], categoryTopRatedCount: 2, cacheTtlMs: 1000, ...opts }) });

describe('CatalogueService', () => {
  it('returns featured products in configured order and skips unknown ids', async () => {
    const { svc } = make();
    expect((await svc.featured()).map((p) => p.id)).toEqual(['5', '1']);
  });

  it('puts top rated first in a category (ties broken by review count) and the rest after', async () => {
    const { svc } = make();
    const page = await svc.categoryPage('jewelery');
    expect(page?.topRated.map((p) => p.id)).toEqual(['3', '2']);
    expect(page?.others.map((p) => p.id)).toEqual(['1', '4']);
  });

  it('returns null for an unknown category', async () => {
    expect(await make().svc.categoryPage('nope')).toBeNull();
  });

  it('search is case-insensitive, matches title/description/category, and requires every term', async () => {
    const { svc } = make();
    expect((await svc.search('RING')).map((p) => p.id)).toEqual(['1', '2', '5']);
    expect((await svc.search('ring jewelry')).map((p) => p.id)).toEqual(['1']);
    expect(await svc.search('zzz')).toEqual([]);
  });

  it('empty search returns nothing rather than the whole catalogue', async () => {
    expect(await make().svc.search('   ')).toEqual([]);
  });

  it('caches the provider within the TTL and refetches after it expires', async () => {
    let t = 0;
    const provider = new FakeProvider();
    const { svc } = make({ now: () => t }, provider);
    await svc.featured();
    await svc.get('1');
    expect(provider.calls).toBe(1);
    t = 2000;
    await svc.get('1');
    expect(provider.calls).toBe(2);
  });

  it('lists distinct categories sorted by name', async () => {
    expect((await make().svc.categories()).map((c) => c.name)).toEqual(['electronics', 'jewelery']);
  });
});

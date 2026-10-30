import { FakeStoreProvider } from '../src/providers/fakeStoreProvider';
import { ProductSourceError } from '../src/providers/productProvider';

const json = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status });
const provider = (fetchImpl: typeof fetch) => new FakeStoreProvider({ baseUrl: 'http://x', fetchImpl });

describe('FakeStoreProvider', () => {
  it('maps upstream data into the domain model', async () => {
    const items = await provider(json([
      { id: 7, title: 'T', price: 9.5, description: 'D', category: "men's clothing", image: 'i.png', rating: { rate: 4, count: 3 } },
    ]) as typeof fetch).listProducts();
    expect(items[0]).toMatchObject({ id: '7', category: { slug: 'mens-clothing', name: "men's clothing" }, currency: 'USD' });
  });

  it('wraps upstream HTTP failures', async () => {
    await expect(provider(json({}, 500) as typeof fetch).listProducts()).rejects.toBeInstanceOf(ProductSourceError);
  });

  it('wraps network failures', async () => {
    const failing = (async () => { throw new Error('ECONNREFUSED'); }) as typeof fetch;
    await expect(provider(failing).listProducts()).rejects.toBeInstanceOf(ProductSourceError);
  });

  it('rejects unexpected upstream shapes', async () => {
    await expect(provider(json([{ id: 'nope' }]) as typeof fetch).listProducts()).rejects.toBeInstanceOf(ProductSourceError);
  });
});

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json, mockApi, product, renderAt, restoreFetch } from './helpers';

afterEach(() => restoreFetch());

const categories = () => json({ categories: [{ slug: 'jewelery', name: 'jewelery' }] });

describe('browsing', () => {
  it('home page shows the featured products', async () => {
    const featured = [1, 2, 3, 4, 5].map((n) => product({ id: String(n), title: `Item ${n}` }));
    mockApi({ '/api/categories': categories, '/api/products/featured': () => json({ products: featured }) });
    renderAt('/');
    const list = await screen.findByRole('list', { name: 'Top rated products' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
  });

  it('category page shows top rated and additional products', async () => {
    mockApi({
      '/api/categories': categories,
      '/api/categories/jewelery': () => json({
        category: { slug: 'jewelery', name: 'jewelery' },
        topRated: [product({ id: '1', title: 'Best Ring' })],
        others: [product({ id: '2', title: 'Other Ring' })],
      }),
    });
    renderAt('/categories/jewelery');
    expect(await screen.findByRole('list', { name: 'Top rated in jewelery' })).toHaveTextContent('Best Ring');
    expect(screen.getByRole('list', { name: 'More in jewelery' })).toHaveTextContent('Other Ring');
  });

  it('submitting the search box searches via the backend and shows only the results', async () => {
    const calls = mockApi({
      '/api/categories': categories,
      '/api/products': () => json({ products: [product({ title: 'Silver Ring' })] }),
    });
    renderAt('/');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products' }), 'ring');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('list', { name: 'Search results' })).toHaveTextContent('Silver Ring');
    expect(calls.some((c) => c.url === '/api/products?q=ring')).toBe(true);
  });

  it('shows a helpful empty state when nothing matches', async () => {
    mockApi({ '/api/categories': categories, '/api/products': () => json({ products: [] }) });
    renderAt('/search?q=zzz');
    expect(await screen.findByText(/No products match/)).toBeInTheDocument();
  });

  it('shows an error message when the backend is unavailable', async () => {
    mockApi({
      '/api/categories': categories,
      '/api/products/featured': () => json({ message: 'The catalogue is temporarily unavailable.' }, 502),
    });
    renderAt('/');
    expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');
  });
});

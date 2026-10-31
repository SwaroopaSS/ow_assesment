import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../src/App';
import type { Product } from '../src/types';

export const product = (over: Partial<Product> = {}): Product => ({
  id: '1', title: 'Gold Ring', description: 'Shiny', price: 100, currency: 'USD', image: 'a.png',
  category: { slug: 'jewelery', name: 'jewelery' }, rating: { rate: 4.2, count: 10 }, ...over,
});

/** Minimal Response stand-in (jsdom has no fetch/Response). The client only uses ok, status and json(). */
export const json = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

const realFetch = globalThis.fetch;

/** Replaces fetch with a route table so tests exercise the real client + pages. */
export function mockApi(routes: Record<string, (init?: RequestInit) => Response>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const handler = routes[url.split('?')[0]!];
    return handler ? handler(init) : json({ message: 'not mocked' }, 404);
  }) as typeof fetch;
  return calls;
}
export const restoreFetch = () => {
  globalThis.fetch = realFetch;
};

export const renderAt = (path: string) =>
  render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>);

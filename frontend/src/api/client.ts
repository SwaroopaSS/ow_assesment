import type { Category, CategoryPage, EnquiryInput, Product } from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? 'Something went wrong. Please try again.', res.status, body.fields);
  }
  return res.json() as Promise<T>;
}

/** All server access lives here, so swapping transport or adding auth is a one-file change. */
export const api = {
  featured: () => request<{ products: Product[] }>('/products/featured').then((r) => r.products),
  categories: () => request<{ categories: Category[] }>('/categories').then((r) => r.categories),
  category: (slug: string) => request<CategoryPage>(`/categories/${encodeURIComponent(slug)}`),
  search: (q: string) => request<{ products: Product[] }>(`/products?q=${encodeURIComponent(q)}`).then((r) => r.products),
  product: (id: string) => request<{ product: Product }>(`/products/${encodeURIComponent(id)}`).then((r) => r.product),
  enquire: (input: EnquiryInput) => request<{ status: string }>('/enquiries', { method: 'POST', body: JSON.stringify(input) }),
};
export type Api = typeof api;

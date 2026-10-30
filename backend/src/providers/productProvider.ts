import type { Product } from '../domain/product';

/**
 * Port for the product data source. Implement this to plug in a new catalogue
 * (database, PIM, CMS...). The rest of the app only sees this interface.
 */
export interface ProductProvider {
  listProducts(): Promise<Product[]>;
}

export class ProductSourceError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ProductSourceError';
  }
}

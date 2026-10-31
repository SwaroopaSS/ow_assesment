
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category: Category;
  rating: { rate: number; count: number };
}

export interface Category {
  slug: string;
  name: string;
}

export interface CategoryPage {
  category: Category;
  topRated: Product[];
  others: Product[];
}

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

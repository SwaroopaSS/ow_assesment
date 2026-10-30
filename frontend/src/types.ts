export interface Category { slug: string; name: string }
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
export interface CategoryPage { category: Category; topRated: Product[]; others: Product[] }
export interface EnquiryInput { productId: string; name: string; email: string; phone: string; message: string }

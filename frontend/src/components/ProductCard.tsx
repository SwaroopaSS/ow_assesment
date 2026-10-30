import { Link } from 'react-router-dom';
import { formatPrice } from '../format';
import type { Product } from '../types';

export function ProductCard({ product }: { product: Product }) {
  return (
    <li className="card">
      <Link to={`/products/${encodeURIComponent(product.id)}`} className="card-link">
        <div className="card-image">
          <img src={product.image} alt="" loading="lazy" />
        </div>
        <h3 className="card-title">{product.title}</h3>
        <p className="card-meta">
          <span>{formatPrice(product.price, product.currency)}</span>
          <span aria-label={`Rated ${product.rating.rate} out of 5`}>★ {product.rating.rate}</span>
        </p>
      </Link>
    </li>
  );
}

export function ProductGrid({ products, label }: { products: Product[]; label: string }) {
  return (
    <ul className="grid" aria-label={label}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ul>
  );
}

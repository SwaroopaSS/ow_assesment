import { api } from '../api/client';
import { useAsync } from '../api/useAsync';
import { AsyncView } from '../components/AsyncView';
import { ProductGrid } from '../components/ProductCard';

export function HomePage() {
  const featured = useAsync(api.featured, 'featured');
  return (
    <>
      <h1>Top rated</h1>
      <AsyncView state={featured}>{(products) => <ProductGrid products={products} label="Top rated products" />}</AsyncView>
    </>
  );
}

import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAsync } from '../api/useAsync';
import { AsyncView } from '../components/AsyncView';
import { ProductGrid } from '../components/ProductCard';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q')?.trim() ?? '';
  const results = useAsync(() => (q ? api.search(q) : Promise.resolve([])), q);
  return (
    <>
      <h1>Results for “{q}”</h1>
      <AsyncView state={results}>
        {(products) =>
          products.length === 0 ? (
            <p className="state">No products match “{q}”. Try a different word, or browse a category.</p>
          ) : (
            <ProductGrid products={products} label="Search results" />
          )
        }
      </AsyncView>
    </>
  );
}

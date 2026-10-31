import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAsync } from '../api/useAsync';
import { AsyncView } from '../components/AsyncView';
import { ProductGrid } from '../components/ProductCard';

export function CategoryPage() {
  const { slug = '' } = useParams();
  const page = useAsync(() => api.category(slug), slug);
  return (
    <AsyncView state={page}>
      {({ category, topRated, others }) => (
        <>
          <h1 className="capitalize">{category.name}</h1>
          <h2>Top rated</h2>
          <ProductGrid products={topRated} label={`Top rated in ${category.name}`} />
          {others.length > 0 && (
            <>
              <h2>More in {category.name}</h2>
              <ProductGrid products={others} label={`More in ${category.name}`} />
            </>
          )}
        </>
      )}
    </AsyncView>
  );
}

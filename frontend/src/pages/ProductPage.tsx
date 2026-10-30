import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAsync } from '../api/useAsync';
import { AsyncView } from '../components/AsyncView';
import { EnquiryForm } from '../components/EnquiryForm';
import { formatPrice } from '../format';

export function ProductPage() {
  const { id = '' } = useParams();
  const product = useAsync(() => api.product(id), id);
  const [enquiring, setEnquiring] = useState(false);

  return (
    <AsyncView state={product}>
      {(p) => (
        <article className="product">
          <img className="product-image" src={p.image} alt={p.title} />
          <div>
            <p><Link to={`/categories/${encodeURIComponent(p.category.slug)}`} className="capitalize">{p.category.name}</Link></p>
            <h1>{p.title}</h1>
            <p className="price">{formatPrice(p.price, p.currency)}</p>
            <p>★ {p.rating.rate} ({p.rating.count} reviews)</p>
            <p>{p.description}</p>
            {enquiring ? (
              <EnquiryForm product={p} onCancel={() => setEnquiring(false)} />
            ) : (
              <button onClick={() => setEnquiring(true)}>Enquire</button>
            )}
          </div>
        </article>
      )}
    </AsyncView>
  );
}

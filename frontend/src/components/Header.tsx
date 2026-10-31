import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAsync } from '../api/useAsync';

export function Header() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [term, setTerm] = useState(params.get('q') ?? '');
  const categories = useAsync(api.categories, 'categories');

  useEffect(() => setTerm(params.get('q') ?? ''), [params]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="header">
      <div className="container header-row">
        <Link to="/" className="brand">Catalogue</Link>
        <form role="search" onSubmit={onSubmit} className="search">
          <label htmlFor="search" className="visually-hidden">Search products</label>
          <input id="search" type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search products" />
          <button type="submit">Search</button>
        </form>
      </div>
      <nav className="container nav" aria-label="Categories">
        {categories.status === 'success' &&
          categories.data.map((c) => (
            <Link key={c.slug} to={`/categories/${encodeURIComponent(c.slug)}`}>{c.name}</Link>
          ))}
      </nav>
    </header>
  );
}

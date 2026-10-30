import type { ReactNode } from 'react';
import type { AsyncState } from '../api/useAsync';
import { ApiError } from '../api/client';

interface Props<T> {
  state: AsyncState<T>;
  children: (data: T) => ReactNode;
}

export function AsyncView<T>({ state, children }: Props<T>) {
  if (state.status === 'loading') return <p className="state" role="status">Loading…</p>;
  if (state.status === 'error') {
    const notFound = state.error instanceof ApiError && state.error.status === 404;
    return (
      <p className="state state-error" role="alert">
        {notFound ? 'We could not find that page.' : state.error.message}
      </p>
    );
  }
  return <>{children(state.data)}</>;
}

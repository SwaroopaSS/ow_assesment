import { cloneElement, type FormEvent, type ReactElement, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Product } from '../types';

type Fields = { name: string; email: string; phone: string; message: string };
const empty: Fields = { name: '', email: '', phone: '', message: '' };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Client-side checks are for fast feedback only; the server is the authority.
function validate(f: Fields): Partial<Fields> {
  const errors: Partial<Fields> = {};
  if (!f.name.trim()) errors.name = 'Enter your name';
  if (!emailPattern.test(f.email.trim())) errors.email = 'Enter a valid email address';
  return errors;
}

export function EnquiryForm({ product, onCancel }: { product: Product; onCancel: () => void }) {
  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const set = (key: keyof Fields) => (e: { target: { value: string } }) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length) return;

    setStatus('sending');
    setSubmitError(null);
    try {
      await api.enquire({ productId: product.id, ...fields });
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'sent') {
    return (
      <section className="thanks" role="status">
        <h2>Thank you</h2>
        <p>We have received your enquiry about {product.title} and will be in touch soon.</p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="form" aria-label={`Enquire about ${product.title}`}>
      <h2>Enquire about this product</h2>
      <Field label="Name" error={errors.name}>
        <input value={fields.name} onChange={set('name')} autoComplete="name" required />
      </Field>
      <Field label="Email" error={errors.email}>
        <input type="email" value={fields.email} onChange={set('email')} autoComplete="email" required />
      </Field>
      <Field label="Phone (optional)" error={errors.phone}>
        <input type="tel" value={fields.phone} onChange={set('phone')} autoComplete="tel" />
      </Field>
      <Field label="Message (optional)" error={errors.message}>
        <textarea rows={4} value={fields.message} onChange={set('message')} maxLength={2000} />
      </Field>
      {submitError && <p className="state-error" role="alert">{submitError}</p>}
      <div className="form-actions">
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send enquiry'}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactElement }) {
  const id = `f-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-err` : undefined })}
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
    </div>
  );
}

import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { EmailDeliveryError } from '../providers/emailProvider';
import { ProductSourceError } from '../providers/productProvider';

export class NotFoundError extends Error {}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const fields = Object.fromEntries(err.issues.map((i) => [i.path.join('.') || 'body', i.message]));
    res.status(400).json({ error: 'validation_failed', fields });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: 'not_found', message: err.message });
    return;
  }
  if (err instanceof ProductSourceError) {
    console.error(err);
    res.status(502).json({ error: 'catalogue_unavailable', message: 'The catalogue is temporarily unavailable.' });
    return;
  }
  if (err instanceof EmailDeliveryError) {
    console.error(err);
    res.status(502).json({ error: 'email_failed', message: 'We could not send your enquiry. Please try again.' });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'invalid_json' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'internal_error', message: 'Something went wrong.' });
};

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json, mockApi, product, renderAt, restoreFetch } from './helpers';

afterEach(() => restoreFetch());

const setup = (enquiry: () => Response = () => json({ status: 'received' }, 202)) => {
  const calls = mockApi({
    '/api/categories': () => json({ categories: [] }),
    '/api/products/1': () => json({ product: product() }),
    '/api/enquiries': enquiry,
  });
  renderAt('/products/1');
  return calls;
};
const open = async () => userEvent.click(await screen.findByRole('button', { name: 'Enquire' }));

describe('enquiry flow', () => {
  it('product page shows details and an Enquire button', async () => {
    setup();
    expect(await screen.findByRole('heading', { name: 'Gold Ring' })).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('submits the form and shows a thank-you message', async () => {
    const calls = setup();
    await open();
    await userEvent.type(screen.getByLabelText('Name'), 'Ada Lovelace');
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    const post = calls.find((c) => c.url === '/api/enquiries')!;
    expect(JSON.parse(post.init!.body as string)).toMatchObject({ productId: '1', name: 'Ada Lovelace', email: 'ada@example.com' });
  });

  it('blocks submission and explains what to fix when required fields are invalid', async () => {
    const calls = setup();
    await open();
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByText('Enter your name')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(calls.some((c) => c.url === '/api/enquiries')).toBe(false);
  });

  it('does NOT say thank you when the server fails, and keeps what the customer typed', async () => {
    setup(() => json({ message: 'We could not send your enquiry. Please try again.' }, 502));
    await open();
    await userEvent.type(screen.getByLabelText('Name'), 'Ada');
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('could not send');
    expect(screen.queryByRole('heading', { name: 'Thank you' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Ada');
  });
});

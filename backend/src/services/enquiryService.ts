import { z } from 'zod';
import type { Product } from '../domain/product';
import type { EmailProvider } from '../providers/emailProvider';

/** Single source of truth for enquiry input rules. The client mirrors them for UX only. */
export const enquirySchema = z.object({
  productId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1, 'Enter your name').max(100),
  email: z.string().trim().email('Enter a valid email address').max(200),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

// Strip CR/LF so user input can never inject extra email headers via the subject.
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ');

export class EnquiryService {
  constructor(
    private readonly email: EmailProvider,
    private readonly salesInbox: string,
  ) {}

  async submit(input: EnquiryInput, product: Product): Promise<void> {
    await this.email.send({
      to: this.salesInbox,
      replyTo: input.email,
      subject: oneLine(`New enquiry: ${product.title} (#${product.id})`),
      // Plain text only: nothing user-supplied is ever interpreted as HTML.
      text: [
        `Product: ${product.title} (#${product.id})`,
        `Price: ${product.price} ${product.currency}`,
        '',
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Phone: ${input.phone || '-'}`,
        '',
        'Message:',
        input.message || '-',
      ].join('\n'),
    });
  }
}

import type { Product } from '../src/domain/product';
import type { ProductProvider } from '../src/providers/productProvider';
import { EmailDeliveryError, type EmailMessage, type EmailProvider } from '../src/providers/emailProvider';

const cat = (name: string) => ({ slug: name.replace(/\W+/g, '-'), name });

export const products: Product[] = [
  { id: '1', title: 'Gold Ring', description: 'Shiny jewelry piece', price: 100, currency: 'USD', image: 'a.png', category: cat('jewelery'), rating: { rate: 4.0, count: 10 } },
  { id: '2', title: 'Silver Ring', description: 'Plain band', price: 50, currency: 'USD', image: 'b.png', category: cat('jewelery'), rating: { rate: 4.8, count: 5 } },
  { id: '3', title: 'Pearl Necklace', description: 'Elegant', price: 80, currency: 'USD', image: 'c.png', category: cat('jewelery'), rating: { rate: 4.8, count: 50 } },
  { id: '4', title: 'Bronze Bracelet', description: 'Rustic', price: 20, currency: 'USD', image: 'd.png', category: cat('jewelery'), rating: { rate: 3.0, count: 2 } },
  { id: '5', title: 'Laptop', description: 'Fast computer with a Ring light', price: 900, currency: 'USD', image: 'e.png', category: cat('electronics'), rating: { rate: 4.5, count: 20 } },
];

export class FakeProvider implements ProductProvider {
  calls = 0;
  constructor(private items: Product[] = products) {}
  async listProducts() {
    this.calls++;
    return this.items;
  }
}

export class FakeEmail implements EmailProvider {
  sent: EmailMessage[] = [];
  fail = false;
  async send(message: EmailMessage) {
    if (this.fail) throw new EmailDeliveryError('smtp down') // providers must honour the port's error contract;
    this.sent.push(message);
  }
}

# Product catalogue PoC

Search and browse a product catalogue, and send an enquiry to the sales inbox.

- **Client:** React 18 + TypeScript, bundled with esbuild
- **Backend:** Node.js + TypeScript (Express). It also serves the built client, so the whole app runs on one port
- **Product data:** [Fake Store API](https://fakestoreapi.com), accessed *only* by the backend
- **Email:** each enquiry is written as a text file in `backend/outbox/` (no accounts, no extra software). SMTP is supported for real delivery
- **Tests:** Jest (backend and frontend)

**Why this stack:** React and Node share TypeScript across the stack, which keeps a small team fast. Express is minimal enough that the layering (routes → services → providers) is visible in the code. esbuild keeps the client build to one small script instead of a framework toolchain.

## Run it (about 3 minutes)

Requires Node 20+ and nothing else. No `.env` file is needed.

```bash
npm run setup     # installs backend and frontend dependencies
npm start         # builds the client and the backend, then starts on http://localhost:4000
```

Open **http://localhost:4000**. Submit an enquiry on any product, then open the newest file in **`backend/outbox/`** to see the email the sales team would receive.

## Development with live rebuilds

```bash
cd frontend && npm run dev     # terminal 1: rebuilds the client on every change
cd backend  && npm run dev     # terminal 2: restarts the API on every change
```

Reload http://localhost:4000 after a client change.

## Tests

```bash
npm test                       # both
cd backend  && npm test        # service rules, provider mapping/failure, HTTP API, enquiry email, static serving
cd frontend && npm test        # browse, search, category, product and enquiry flows, including failure
```

## Configuration

Everything has a default. To change settings, copy [`.env.example`](.env.example) to `backend/.env`. It contains no secrets and `.env` is git-ignored. Notable settings:

- `FEATURED_PRODUCT_IDS`: the 5 curated "top rated" products on the home page.
- `CATEGORY_TOP_RATED_COUNT`: how many top rated products lead each category page.
- `EMAIL_PROVIDER`: `file` (default), `console` or `smtp`. `SALES_INBOX` is the recipient.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/products/featured` | The curated home page products |
| `GET /api/categories` | Category list |
| `GET /api/categories/:slug` | `{ category, topRated, others }` |
| `GET /api/products?q=` | Search |
| `GET /api/products/:id` | Product details |
| `POST /api/enquiries` | `{ productId, name, email, phone?, message? }` → `202` and an email to the sales inbox |

## Project layout

```
backend/src
  domain/       provider-agnostic Product/Category types
  providers/    ports + adapters: ProductProvider (Fake Store), EmailProvider (file, SMTP, console)
  services/     catalogue + enquiry business rules
  app.ts        HTTP routes, validation, rate limiting, static client   compose.ts  wiring from config
frontend/
  build.mjs     esbuild bundling script
  src/api/client.ts   the only place that talks to the backend
  src/pages, src/components   UI        src/styles/theme.css   design tokens (swap for the creative team's look)
```
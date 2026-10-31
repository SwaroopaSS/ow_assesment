# Decisions and assumptions

## Assumptions (where the acceptance criteria were unclear)

1. **"I have chosen 5 products to be top rated"** — the entrepreneur curates these by hand, so they are a configured list of product ids (`FEATURED_PRODUCT_IDS`), not computed from ratings. Ids that don't exist in the source are skipped rather than crashing the home page. *Default ids 3,6,9,12,15 are arbitrary placeholders.*
2. **"Top rated products for that category"** — computed, not curated: highest `rating.rate`, ties broken by review count, top 3 (configurable). "Additional products" are the remaining products in that category.
3. **Search** matches title, description and category name, case-insensitive; multi-word queries require every word to match (AND). It runs on the backend so the matching rule lives in one place and can later move to a real search engine. An empty search returns nothing rather than the whole catalogue.
4. **Enquire** is a form on the product page. Required: name, email. Optional: phone, message. The enquiry email goes to a single configured `SALES_INBOX`, with `Reply-To` set to the customer so sales can answer directly.
5. **"Thank you" is only shown if the email was actually handed to the mail provider.** If sending fails the customer sees an error and keeps what they typed — silently losing a lead is worse than showing an error.
6. **Currency** is USD (Fake Store has none); modelled as a field so it can change.
7. **No accounts, cart, checkout or pagination** — not in the criteria; the catalogue is 20 items.

## How the design supports growth beyond the PoC

- **Product data source will change** → `ProductProvider` port. Fake Store lives in one adapter that validates the upstream response (zod) and maps it into our own `Product` model; nothing else knows its shape. IDs are opaque strings so a UUID-based source works. Switching to a database/PIM means one new class and one line in `compose.ts`. The client never sees the source, which is also a constraint of the brief.
- **Email provider will change** → `EmailProvider` port with file, console and SMTP adapters. SMTP works with AWS SES; a SendGrid/SES-API adapter is one class.
- **Look and feel will change** → all colours, fonts, radii are CSS variables in one file; components contain no hard-coded styling values.
- **Backend rules vs HTTP** → services are plain classes with no Express dependency, so they can move behind another transport (GraphQL, a second client, a mobile app) unchanged. The error → HTTP mapping is in one middleware.
- **Config** is validated at startup and fails fast with a readable message.
- **Caching:** the source is fetched once per TTL (default 5 min) in memory. Fine for one instance; swap for Redis when scaling horizontally.

## What I would do next with another day

1. Run against the real Fake Store API in CI with a contract test, and add a Playwright happy-path test of the whole stack.
2. Persist enquiries + send email from a background job with retries, so a transient SMTP failure doesn't lose the lead or block the request.
3. Real design system integration once creative delivers; add a11y checks (axe) to tests.
4. Server-side search/pagination, structured logging with request IDs, and a CI pipeline + AWS infrastructure as code.



# AI usage notes

## Tools and models
- Claude (Anthropic) in claude.ai. Model: Claude Sonnet 5.5.

## Agent instruction files
- [`CLAUDE.md`](CLAUDE.md) — architecture rules (client never calls Fake Store, layering, where config/styling live), conventions and commands. Committed to the repo.

## Plan / spec
The plan, in the order it was executed:
1. Pick the stack from the brief's constraints and my background (React + TypeScript, Node/Express + TypeScript).
2. Define the boundaries first: domain model → `ProductProvider` and `EmailProvider` ports → services → HTTP → client.
3. Backend vertical slice with tests, then frontend with tests, then Docker/docs.
4. Verify: typecheck, tests, production builds, and a manual end-to-end run (page, assets, API, enquiry email file) against a stub upstream.
5. Simplify for the reviewer: remove containers and the Vite toolchain, serve the client from the backend, and use a file-based sales inbox.

## Key prompts / moments
1. "Build the take-home from this brief using my profile: React + Node/TypeScript." — set stack and scope.
2. The decision to put product source and email behind interfaces because the brief says both will change — the central design choice.
3. The decision that "Thank you" must only appear if the email send succeeded.
4. The decision to keep styling in a single tokens file because the look and feel will change.

## Where the AI got something wrong, and how it was caught
- **Test fake broke the port contract.** The in-memory email fake threw a plain `Error` while the real SMTP adapter wraps failures in `EmailDeliveryError`. The API test expecting a `502` failed with a `500`, which exposed that the fake did not honour the interface's error contract. Fixed the fake, not the production code.
- **Over-clever test helper.** The first fetch-mock route matcher had convoluted prefix logic. Replaced with matching on the URL path without the query string.
- **Fragile `Field` component.** First draft spread a React element object to inject props; replaced with `cloneElement`.
- **Environment typing.** `vite.config.ts` used `process` without Node types; typecheck caught it.
- **Security header broke the client (caught by reasoning, then verified).** Once the backend served the page, helmet's default Content-Security-Policy would have blocked product images from other hosts and tried to upgrade localhost assets to https. Fixed by relaxing `img-src` and disabling `upgrade-insecure-requests`, and checked the header with curl.
- **Test environment gap.** Jest's jsdom has no `fetch`/`Response`, so the first approach of using real `Response` objects in frontend tests could not work; replaced with a minimal response stand-in.
- **Not verified:** the sandbox could not reach fakestoreapi.com, so the real upstream was NOT exercised by the AI, and nothing was checked in a real browser. TODO: run `npm start` yourself, click through every flow, and record the result here.


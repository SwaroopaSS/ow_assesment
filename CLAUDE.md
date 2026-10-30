# Agent instructions

Product catalogue PoC (React + Express, TypeScript; esbuild for the client, Jest for tests). Read DECISIONS.md before changing structure.

## Architecture rules (do not break)
- The client NEVER calls the Fake Store API; it only calls `/api/*` on our backend.
- Backend layers: `routes (app.ts)` → `services/` (business rules) → `providers/` (external systems behind interfaces). Services must not import from a specific provider implementation, and nothing outside `providers/` may know the Fake Store response shape.
- New product source = new `ProductProvider`; new email service = new `EmailProvider`; wire them only in `src/compose.ts`.
- The backend serves the built client (`frontend/dist`); the client uses relative `/api` URLs only.
- Visual styling lives in `frontend/src/styles/theme.css` (tokens). Do not hard-code colours/fonts in components.
- All server access from the client goes through `frontend/src/api/client.ts`.

## Conventions
- TypeScript strict. Validate all external input with zod at the boundary (HTTP bodies, upstream API responses, env).
- Errors: throw domain errors; map them to HTTP only in `middleware/errors.ts`. Never leak upstream/stack details to clients.
- Emails are plain text only; never interpolate user input into HTML.
- No secrets in the repo; add new config to `.env.example` and `config.ts`.

## Commands
- Backend: `cd backend && npm test && npm run typecheck`
- Frontend: `cd frontend && npm test && npm run typecheck`
- Add a test for every behaviour change; prefer testing through the HTTP API / rendered UI over internals.

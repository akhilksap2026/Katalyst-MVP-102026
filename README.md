# Katalyst / Catalyst MVP

An offline-first OTM helper toolkit: compare automation-agent extracts (DEV vs PROD), browse the OTM data dictionary, and clean pasted lists.

## Stack
pnpm workspace monorepo · Node.js 24 · TypeScript 5.9 · React + Vite (frontend) · Express 5 + Drizzle ORM + PostgreSQL (API) · Zod · Orval (OpenAPI codegen). Originally built on Replit (see `replit.md` for detailed notes).

## Layout
- `artifacts/catalyst/` – Catalyst web app (client-only; processes pasted data in the browser)
- `artifacts/ksap-cloud-ui/` – KSAP cloud UI
- `artifacts/api-server/` – Express API scaffold (not used by Catalyst yet)
- `artifacts/mockup-sandbox/` – component preview sandbox
- `lib/` – shared packages: `api-spec` (OpenAPI), `api-zod`, `api-client-react`, `db` (Drizzle)

## Setup
```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL etc.
pnpm run typecheck
```

## Run
```bash
pnpm --filter @workspace/api-server run dev    # API
PORT=5173 BASE_PATH=/ pnpm --filter <frontend-package> run dev   # frontend (Vite needs PORT and BASE_PATH)
pnpm --filter @workspace/db run push           # push DB schema (dev only)
pnpm run build                                 # typecheck + build all packages
```

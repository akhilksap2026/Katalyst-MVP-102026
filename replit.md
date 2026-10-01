# Catalyst

An offline-first toolkit for comparing automation-agent extracts, browsing a data dictionary, and cleaning pasted lists.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/catalyst/` — Catalyst web application
- `artifacts/api-server/` — shared API service scaffold; Catalyst currently does not use it
- `artifacts/mockup-sandbox/` — reusable component preview sandbox

## Architecture decisions

- Catalyst is client-only and processes pasted data locally in the browser; do not add network persistence without an explicit product change.
- Bundled dictionary and DEV/PROD sample extracts are application assets, not server data.

## Product

- Paste detection routes supported input to the agent comparison, dictionary, or list-cleaning tools.
- Agent Compare reviews added, removed, and changed actions/events between extracts.
- The Data Dictionary supports table lookup and join exploration; the List Utility normalizes and compares values.

## User preferences

_No project-specific preferences recorded._

## Gotchas

- User workspace data is stored locally; clearing browser storage removes local preferences and recent activity.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

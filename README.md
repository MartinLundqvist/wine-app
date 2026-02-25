# Wine App

pnpm monorepo: React SPA, Fastify API, shared packages, Drizzle + Postgres.

## Structure

| Path | Description |
|------|-------------|
| `apps/web` | Vite + React 18, React Router 7, TanStack Query, Tailwind, Framer Motion. Explore (grapes, styles, regions, aromas), landing, login. Vitest, ESLint, Prettier. |
| `apps/api` | Fastify 5, CORS, cookie, static (serves `web/dist` in prod). Auth (JWT access/refresh, bcrypt). Read routes: grapes, regions, map-config, styles, style-targets, aromas. `/health`, `/me`. |
| `packages/db` | Drizzle ORM + postgres.js. Schema: users, grapes, regions, styleTargets, aromas, mapConfig, etc. Exports `@wine-app/db` (client) and `@wine-app/db/schema`. Migrate + seed scripts; local Postgres via Docker. |
| `packages/shared` | Zod schemas and `APP_NAME`. Consumed by `api` and `web`. |

**Workspace:** `pnpm-workspace.yaml` → `apps/*`, `packages/*`. Root scripts: `dev` (parallel web + api), `build`, `db:up` / `db:down`, `db:generate`.

## Development

- **Node:** Use version in `.nvmrc` (e.g. `nvm use`). Engines: `>=20`.
- **Install:** `pnpm install`
- **Dev (web + API):** `pnpm dev`
- **DB (local Docker Postgres + migrate + seed):** `pnpm db:up`
- **DB down:** `pnpm db:down`

## Deployment (Fly.io + Neon)

Single Fly app serves the API and the built web app. Postgres from [Neon](https://neon.tech) (pooled connection).

### Prerequisites

- [Fly CLI](https://fly.io/docs/hub/install-flyctl/) installed and logged in (`fly auth login`)
- [Neon](https://neon.tech) project and database
- Node 24 (see `.nvmrc`)

### Fly secrets (set before first deploy)

Use Neon **pooled** connection string for `DATABASE_URL`.

| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | Neon Postgres pooled URL, e.g. `postgresql://user:pass@ep-xxx.pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Min 32 chars (access tokens) |
| `JWT_REFRESH_SECRET` | Min 32 chars (refresh tokens) |
| `ADMIN_EMAIL` | Email to auto-promote to admin when running seed in production |
| `NODE_ENV` | `production` |

```bash
fly secrets set \
  DATABASE_URL="postgresql://..." \
  JWT_SECRET="your-min-32-char-secret" \
  JWT_REFRESH_SECRET="your-other-min-32-char-secret" \
  ADMIN_EMAIL="admin@example.com" \
  NODE_ENV="production"
```

### Deploy runbook

1. Commit changes; run `pnpm install` if deps changed.
2. **Optional local smoke:** `pnpm build && NODE_ENV=production pnpm --filter api run start` then check http://localhost:3000.
3. **Neon:** Create project/database; copy pooled `DATABASE_URL`.
4. **Fly:** From repo root, `fly launch --no-deploy` (or skip if app exists).
5. Set the four secrets with `fly secrets set ...`.
6. **Deploy:** `fly deploy` (release runs `pnpm --filter @wine-app/db run migrate`).
7. **First-time seed:** `fly ssh console -C "cd /app && pnpm --filter @wine-app/db run seed"`.
8. **Verify:** `curl https://<your-app>.fly.dev/health`; test web and API.

**Later deploys:** `fly deploy` only. Migrations run each deploy; seed is idempotent and not re-run by default.

### Config

- **Region / app name:** `fly.toml` (`primary_region`, `app`).
- **VM:** `fly.toml` uses `shared-cpu-1x`, `512mb`; adjust `[[vm]]` if needed.

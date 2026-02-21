# Wine App

Monorepo: web app (Vite + React), API (Fastify), shared packages, and Drizzle + Postgres.

## Development

- **Node:** Use the version in `.nvmrc` (e.g. `nvm use`).
- **Install:** `pnpm install`
- **Dev (web + API):** `pnpm dev`
- **DB (local Docker Postgres + migrate + seed):** `pnpm db:up`
- **DB down:** `pnpm db:down`

## Deployment (Fly.io + Neon)

Single Fly app serves both the API and the built web app. Postgres is provided by [Neon](https://neon.tech) (no Fly Postgres).

### Prerequisites

- [Fly CLI](https://fly.io/docs/hub/install-flyctl/) installed and logged in (`fly auth login`)
- [Neon](https://neon.tech) account; create a project and database
- Node 24 (see `.nvmrc`)

### Required Fly secrets

Set these **before** the first deploy (or before running the release command). Use Neon’s **pooled** connection string for `DATABASE_URL`.

| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | Neon Postgres connection string (pooled), e.g. `postgresql://user:pass@ep-xxx.pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Min 32 characters; used for access tokens |
| `JWT_REFRESH_SECRET` | Min 32 characters; used for refresh tokens |
| `NODE_ENV` | Set to `production` |

Example (replace values):

```bash
fly secrets set \
  DATABASE_URL="postgresql://..." \
  JWT_SECRET="your-min-32-char-secret" \
  JWT_REFRESH_SECRET="your-other-min-32-char-secret" \
  NODE_ENV="production"
```

### Deploy runbook

1. **Code and lockfile:** Ensure changes are committed and run `pnpm install` if you added dependencies.
2. **Local smoke test (optional):**  
   `pnpm build && NODE_ENV=production pnpm --filter api run start`  
   Then open http://localhost:3000 and check API + web.
3. **Neon:** Create a project and database; copy the pooled `DATABASE_URL`.
4. **Fly app:** From repo root, create the app without deploying:  
   `fly launch --no-deploy`  
   (If the app already exists, skip or use `fly apps create wine-app` as needed.)
5. **Secrets:** Set the four secrets above with `fly secrets set ...`.
6. **Deploy:**  
   `fly deploy`  
   The release command runs DB migrations automatically (`pnpm --filter @wine-app/db run migrate`).
7. **Seed (first time only):**  
   `fly ssh console -C "cd /app && pnpm --filter @wine-app/db run seed"`
8. **Verify:**  
   - Health: `curl https://<your-app>.fly.dev/health`  
   - Web app and API routes (explore, auth, SPA deep links, geo maps).

**Later deploys:** Run `fly deploy` only. Migrations run on each deploy; seed is not re-run (it’s idempotent and insert-only).

### Config

- **Region / app name:** Edit `fly.toml` (`primary_region`, `app`).
- **VM:** `fly.toml` uses `shared-cpu-1x` and `512mb`; adjust `[[vm]]` if needed.

# Wine Web App – Implementation Plan (MVP)

Stack:

- Frontend: React + TypeScript (Vite)
- Backend: Node.js + TypeScript (Fastify or Express)
- Database: Postgres (Dockerized)
- Auth: Email + password (bcrypt, JWT sessions)
- Deploy: Fly.io
- CI/CD: Manual deploy (no GitHub Actions)

---

## 1. Repository Structure (Monorepo)

/apps
    /web # React + Vite frontend
    /api # Node + TS backend
/packages
    /db # Schema + migrations + seed scripts
    /shared # Shared types, enums, validation (Zod)
docker-compose.yml

Principles:

- DB schema is source of truth.
- All DTOs live in `packages/shared`.
- API is the only service that talks to DB.
- Frontend never talks directly to DB.

---

## 2. Database Layer

## 2.1 Local Development

Use docker-compose:

- postgres:16
- Named volume for persistence
- Expose port 5432

`packages/db` responsibilities:

- Migrations
- Seed script
- DB client (Prisma / Drizzle / Kysely)
- Export typed DB access layer

## 2.2 Production (Fly.io)

Separate Fly app:

- App name: `wine-db`
- Postgres container
- Attached Fly volume at:
  `/var/lib/postgresql/data`

Secrets:

- POSTGRES_PASSWORD
- DATABASE_URL (for API app)

Networking:

- API connects via Fly private network.

Start single-region, single-machine.

---

## 3. Backend (apps/api)

Runtime:

- Node 20+
- TypeScript
- Fastify (preferred) or Express

## 3.1 Responsibilities

- Serve REST API
- Serve frontend static build (Option A)
- Run migrations on deploy
- Expose health endpoint
- Handle authentication (email/password, JWT)

## 3.2 Authentication

Simple email + password auth:

- `POST /auth/register` — create account (email, password, optional display_name)
- `POST /auth/login` — returns JWT access token + refresh token
- `POST /auth/refresh` — exchange refresh token for new access token
- `POST /auth/logout` — invalidate refresh token

Implementation:

- Passwords hashed with bcrypt (cost factor 10+)
- JWT access tokens (short-lived, ~15 min)
- Refresh tokens (longer-lived, stored in DB or httpOnly cookie)
- Auth middleware on all `/exercise/*` and `/progress/*` routes
- Read endpoints (`/grapes`, `/attributes`, etc.) can be public

## 3.3 Endpoints (MVP)

Auth:

- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

Read (public):

- GET /grapes
- GET /style-targets
- GET /style-target-attributes
- GET /attributes
- GET /descriptors
- GET /exercise-templates
- GET /confusion-sets
- GET /bottles
- GET /bottle-style-matches

Game (authenticated):

- POST /exercise/generate
- POST /exercise/submit
- GET /progress
- POST /tasting-session

## 3.4 Validation

- Zod schemas in `packages/shared`
- Shared between frontend and backend

---

## 4. Frontend (apps/web)

Framework:

- React
- TypeScript
- Vite

Key libraries:

- `@dnd-kit/core` + `@dnd-kit/sortable` — drag-and-drop for map placement, ordering, and elimination interactions
- `react-query` (TanStack Query) — data fetching and caching
- `react-router` — client-side routing

## 4.1 Build Output

`vite build` → `dist/`

API serves:

- `/assets/*`
- Fallback → `index.html` (SPA routing)

## 4.2 Routing (MVP)

- `/` → Launcher (list of available maps and drills, minimal progress summary)
- `/login` → Login / register form
- `/maps/:id` → Canonical map view (Red Structure, Body & Alcohol, Flavor Direction, White Structure)
- `/drills/:templateId` → Exercise view (renders based on exercise format)
- `/tasting` → Tasting Mode (slider input, archetype distance ranking)
- `/progress` → Progress overview (mastery state per format)

## 4.3 Data Fetching

- React Query
- Typed API client using shared DTOs

---

## 5. Serving Frontend in Production (Option A)

Single Fly app: `wine-api`

Steps:

1. Build frontend during Docker build
2. Copy `apps/web/dist` into API container
3. API serves static files
4. SPA fallback routing

Result:

- One domain
- No CORS complexity
- Single deploy target

---

## 6. Fly.io Setup

## 6.1 Apps

1. `wine-db`
2. `wine-api`

## 6.2 Deployment Flow (Manual)

From local machine:

1. Run migrations
2. Build monorepo
3. `fly deploy` (API app)

No GitHub Actions.

## 6.3 Health Checks

Expose:

GET /health

Used by Fly for safe deploys.

---

## 7. Environment Variables

## API

- DATABASE_URL
- NODE_ENV
- PORT
- JWT_SECRET
- JWT_REFRESH_SECRET

## DB

- POSTGRES_PASSWORD

Secrets set via:

fly secrets set KEY=value

---

## 8. Seeding Strategy

`packages/db/seed.ts`:

- Attributes + scales
- Grapes
- Style targets
- style_target_attribute coordinates
- Descriptors
- style_target_descriptor mappings
- Exercise templates
- Confusion sets (optional MVP)
- Wine bottles + bottle_style_match (optional MVP)

Run:

pnpm db:seed

---

## 9. Deployment Workflow (Manual)

Local development:

- `docker compose up`
- `pnpm dev`

Production deploy:

1. `pnpm -r build`
2. `pnpm db:migrate`
3. `fly deploy`

No automation.

---

## 10. Non-Goals (MVP)

- No horizontal scaling
- No background workers
- No microservices
- No CI/CD
- No OAuth / social login (email + password only)
- No Fly Postgres managed cluster

Keep architecture simple.

---

## 11. Future Evolution

Add only when needed:

- GitHub Actions
- Background job worker
- Multi-region API
- Read replicas
- OAuth / social login
- Event-driven scoring engine

---

## Guiding Principle

Optimize for:

- Simplicity
- Determinism
- Typed contracts
- Single deploy target
- Minimal operational surface area

Ship fast. Iterate later.

---
name: Wine styles CRUD v2
overview: "Revise the original plan to remove ambiguous decisions and prefer simple, durable implementation choices: DB-backed admin authorization, explicit PATCH semantics, transactional writes, compatibility-preserving read routes, and MCP write auth via login credentials (not copied short-lived tokens)."
todos:
  - id: db-role-migration
    content: Add user role enum/column, generate migration, and seed admin promotion via env email.
    status: pending
  - id: auth-admin-guard
    content: Extend auth payload/responses with role and implement DB-backed requireAdmin middleware.
    status: pending
  - id: shared-write-schemas
    content: Add strict create/patch/id schemas for wine style writes in shared package.
    status: pending
  - id: api-transactional-crud
    content: Implement wine styles service + transactional CRUD routes with FK validation and compatibility-safe read reuse.
    status: pending
  - id: web-admin-phase-a
    content: Add role-aware auth/client plumbing, AdminRoute, navbar admin link, and core wine style admin CRUD UI.
    status: pending
  - id: mcp-server
    content: Create mcp-wine stdio package with read/write tools and login-based write authentication.
    status: pending
  - id: verification-gates
    content: Run build/lint and functional auth/CRUD/compatibility smoke checks before completion.
    status: pending
isProject: false
---

# Wine Styles CRUD + Admin + MCP (Revised)

## Technical choices (locked)

- **Admin authorization source of truth:** database role on every admin mutation request.
  - JWT may still include `role` for UI convenience, but `requireAdmin` validates current role from DB to avoid stale elevated access.
- **Update semantics:** `PATCH /wine-styles/:id` (partial update), not ambiguous `PUT` full-replace.
  - Relation arrays are **replace-on-present** (if a relation field is present, replace that relation set; if absent, leave unchanged).
- **Write consistency:** all create/update/delete operations run inside a DB transaction.
- **Backward compatibility:** keep `/style-targets`, `/style-targets/:id`, and `/style-targets/:id/confusion-group` response shape/behavior unchanged.
- **MCP write auth:** MCP server uses `WINE_APP_ADMIN_EMAIL` + `WINE_APP_ADMIN_PASSWORD` to obtain a fresh access token by calling `/auth/login` per write operation (or cached with short TTL), instead of manually copied expiring token.

## Scope and file targets

- DB + auth schema/migration:
  - [packages/db/src/schema/users.ts](packages/db/src/schema/users.ts)
  - [packages/db/src/schema/enums.ts](packages/db/src/schema/enums.ts)
  - [packages/db/drizzle](packages/db/drizzle)
  - [packages/db/src/seed.ts](packages/db/src/seed.ts)
- Shared validation/contracts:
  - [packages/shared/src/schemas.ts](packages/shared/src/schemas.ts)
- API auth + routes + services:
  - [apps/api/src/auth/jwt.ts](apps/api/src/auth/jwt.ts)
  - [apps/api/src/auth/preHandler.ts](apps/api/src/auth/preHandler.ts)
  - [apps/api/src/auth/routes.ts](apps/api/src/auth/routes.ts)
  - [apps/api/src/routes/read.ts](apps/api/src/routes/read.ts)
  - [apps/api/src/routes/wineStyles.ts](apps/api/src/routes/wineStyles.ts)
  - [apps/api/src/services/wineStyles.ts](apps/api/src/services/wineStyles.ts)
  - [apps/api/src/index.ts](apps/api/src/index.ts)
- Frontend auth/client/admin UI:
  - [apps/web/src/api/client.ts](apps/web/src/api/client.ts)
  - [apps/web/src/contexts/AuthContext.tsx](apps/web/src/contexts/AuthContext.tsx)
  - [apps/web/src/components/ProtectedRoute.tsx](apps/web/src/components/ProtectedRoute.tsx)
  - [apps/web/src/components/landing/Navbar.tsx](apps/web/src/components/landing/Navbar.tsx)
  - [apps/web/src/App.tsx](apps/web/src/App.tsx)
  - [apps/web/src/pages/admin](apps/web/src/pages/admin)
- New MCP package:
  - [packages/mcp-wine](packages/mcp-wine)

## Implementation plan

### 1) Admin role foundation

- Add `user_role` enum (`user`, `admin`) and `role` column on `user` table with default `user`.
- Generate/apply migration in [packages/db/drizzle](packages/db/drizzle).
- Seed strategy:
  - Keep normal seeded users as `user`.
  - Promote one admin via env-configured email in seed (`ADMIN_EMAIL`) if present.
- Extend auth responses (`register`, `login`, `refresh`) to include `role` in `user` object.
- Extend access token payload with `role` for client UX.

### 2) Auth guards and `/me`

- Implement `requireAdmin` in [apps/api/src/auth/preHandler.ts](apps/api/src/auth/preHandler.ts):
  - Requires valid access token first.
  - Loads current user row by `req.user.userId` and verifies `role === 'admin'`.
  - Returns `403` `{ error: "Forbidden", message: "Admin role required" }` when unauthorized.
- Keep `/me` returning `{ user }`, now with `role` from token payload.

### 3) Shared schemas for write API

- Add write schemas in [packages/shared/src/schemas.ts](packages/shared/src/schemas.ts):
  - `wineStyleCreateSchema`: required core fields + optional relation arrays.
  - `wineStylePatchSchema`: partial core + optional relation arrays; `.strict()`.
  - `wineStyleIdParamSchema` for route params.
- Reuse existing enums and range validation conventions.
- Keep response parsing with existing `wineStyleFullSchema`.

### 4) API service + CRUD routes (transactional)

- Extract/centralize `buildWineStyleFull` into shared API service module so both read and CRUD routes use one formatter.
- Implement [apps/api/src/services/wineStyles.ts](apps/api/src/services/wineStyles.ts):
  - `createWineStyle(input)`
  - `patchWineStyle(id, patch)`
  - `deleteWineStyle(id)`
- Service rules:
  - Validate FK existence for referenced IDs before write.
  - For `patch`: update only provided core fields.
  - For each relation array field present, replace that relation set atomically.
  - Run each operation in one DB transaction.
  - Return 404 if style not found.
- Add routes in [apps/api/src/routes/wineStyles.ts](apps/api/src/routes/wineStyles.ts):
  - `GET /wine-styles`
  - `GET /wine-styles/:id`
  - `POST /wine-styles` (`requireAdmin`)
  - `PATCH /wine-styles/:id` (`requireAdmin`)
  - `DELETE /wine-styles/:id` (`requireAdmin`)
- Keep existing `/style-targets`* routes intact and verify unchanged output contracts.

### 5) Frontend auth and admin UX (phased)

- **Token handling choice:** keep `api` read methods public/no token; add explicit authenticated methods that accept token parameter.
  - Avoid global mutable token holder.
  - Admin pages call mutation methods with `state.accessToken` from `useAuth()`.
- Extend `AuthUser` with `role` and propagate through auth context.
- Add `AdminRoute` based on `useAuth()` state:
  - unauthenticated -> `/login`
  - non-admin -> `/` (or lightweight forbidden panel)
- Add admin routes in [apps/web/src/App.tsx](apps/web/src/App.tsx):
  - `/admin/wine-styles`
  - `/admin/wine-styles/new`
  - `/admin/wine-styles/:id/edit`
- Add Admin link in navbar only when `state.user?.role === 'admin'`.
- **UI phasing for simplicity:**
  - Phase A: core fields CRUD + delete.
  - Phase B: relation editors (grapes/structure/appearance/aromas).

### 6) MCP package (API-backed)

- Create [packages/mcp-wine](packages/mcp-wine) as stdio MCP server using `@modelcontextprotocol/sdk`.
- Tools:
  - `wine_list_styles`
  - `wine_get_style`
  - `wine_create_style`
  - `wine_update_style` (PATCH)
  - `wine_delete_style`
- Auth behavior:
  - Read tools call public GET endpoints.
  - Write tools call `/auth/login` with env credentials, use returned access token for immediate write call.
- Return API error details in normalized tool output (status + message).
- Add README with local run/setup and required env vars.

### 7) Verification gates before merge

- API functional checks:
  - 401 without token, 403 for non-admin, 200/201 for admin writes.
  - 400 for invalid payload/FK, 404 for missing IDs.
- Contract checks:
  - `/style-targets` and `/style-targets/:id` still match current frontend expectations.
- Build/type checks:
  - `pnpm run build`
- Lint checks on touched files.
- Manual smoke:
  - Admin can create/edit/delete a style from `/admin/wine-styles`.
  - Non-admin cannot access admin page or write endpoints.

## Execution order

1. DB role enum/column + migration + seed admin promotion.
2. Auth payload/response role + `requireAdmin` DB check.
3. Shared write schemas.
4. API transactional CRUD + route registration.
5. Frontend role plumbing + AdminRoute + Phase A UI.
6. MCP package with credentialed write flow.
7. Phase B relation editors + full verification pass.

## Risks and mitigations

- **Role drift between token and DB:** mitigate by DB check in `requireAdmin`.
- **Partial write corruption:** mitigate with transactions.
- **Contract regressions for existing pages:** mitigate by preserving `/style-targets`* handlers and validating response shape.
- **MCP auth fragility:** mitigate by programmatic login instead of copied short-lived token.


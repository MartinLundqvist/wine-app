---
name: Wine styles CRUD v3
overview: Revised plan addressing ID generation, buildWineStyleFull extraction detail, Phase B todo, MCP token strategy, and route duplication clarity. All original "locked" technical choices retained.
todos:
  - id: db-role-migration
    content: Add userRoleEnum + role column on user table, generate migration, seed admin promotion via ADMIN_EMAIL env.
    status: pending
  - id: auth-admin-guard
    content: Extend AccessPayload/responses with role; implement DB-backed requireAdmin middleware.
    status: pending
  - id: shared-write-schemas
    content: Add wineStyleIdSchema, wineStyleCreateSchema, wineStylePatchSchema, wineStyleIdParamSchema to shared package.
    status: pending
  - id: api-service-extract
    content: Extract buildWineStyleFull from read.ts into services/wineStyles.ts; update read.ts to import from service.
    status: pending
  - id: api-transactional-crud
    content: Implement create/patch/delete in wineStyles service with FK validation + transactions; add CRUD routes with requireAdmin.
    status: pending
  - id: web-admin-phase-a
    content: Extend AuthUser with role, add AdminRoute, navbar admin link, admin CRUD pages for core wine style fields.
    status: pending
  - id: web-admin-phase-b
    content: Add relation editors (grapes, structure, appearance, aroma clusters, aroma descriptors) to admin create/edit forms.
    status: pending
  - id: mcp-server
    content: Create mcp-wine stdio package with read/write tools and login-per-write authentication.
    status: pending
  - id: verification-gates
    content: Build/lint, auth/CRUD smoke checks, contract compatibility verification for /style-targets routes.
    status: pending
isProject: false
---

# Wine Styles CRUD + Admin + MCP (v3)

## Technical choices (locked)

- **Admin authorization source of truth:** database role on every admin mutation request.
  - JWT includes `role` for UI convenience, but `requireAdmin` validates current role from DB to avoid stale elevated access.
- **Update semantics:** `PATCH /wine-styles/:id` (partial update).
  - Relation arrays are **replace-on-present** (if a relation field is present, replace that relation set; if absent, leave unchanged).
- **Write consistency:** all create/update/delete operations run inside a DB transaction.
- **Backward compatibility:** keep `/style-targets`, `/style-targets/:id`, and `/style-targets/:id/confusion-group` response shape/behavior unchanged.
- **MCP write auth:** MCP server calls `/auth/login` with env credentials to obtain a fresh access token **per write operation** (no caching). Simple, stateless, and robust for the low-frequency stdio use case.
- **Wine style ID strategy:** `id` is user-supplied on create (required `varchar(64)` slug, e.g. `"marlborough_sauvignon_blanc"`). This preserves the existing convention of human-readable slugs. The create schema validates format with a regex pattern (`^[a-z0-9_]+$`).

## Scope and file targets

- DB + auth schema/migration:
  - [packages/db/src/schema/users.ts](packages/db/src/schema/users.ts) -- add `role` column
  - [packages/db/src/schema/enums.ts](packages/db/src/schema/enums.ts) -- add `userRoleEnum`
  - [packages/db/drizzle](packages/db/drizzle) -- new migration
  - [packages/db/src/seed.ts](packages/db/src/seed.ts) -- admin promotion via `ADMIN_EMAIL` env
- Shared validation/contracts:
  - [packages/shared/src/schemas.ts](packages/shared/src/schemas.ts) -- add create/patch/id-param schemas
- API auth + routes + services:
  - [apps/api/src/auth/jwt.ts](apps/api/src/auth/jwt.ts) -- extend `AccessPayload` with `role`
  - [apps/api/src/auth/preHandler.ts](apps/api/src/auth/preHandler.ts) -- add `requireAdmin`
  - [apps/api/src/auth/routes.ts](apps/api/src/auth/routes.ts) -- include `role` in auth responses
  - [apps/api/src/routes/read.ts](apps/api/src/routes/read.ts) -- **modify**: replace local `buildWineStyleFull` with import from service
  - [apps/api/src/routes/wineStyles.ts](apps/api/src/routes/wineStyles.ts) -- **new**: CRUD routes
  - [apps/api/src/services/wineStyles.ts](apps/api/src/services/wineStyles.ts) -- **new**: extracted `buildWineStyleFull` + transactional create/patch/delete
  - [apps/api/src/index.ts](apps/api/src/index.ts) -- register new wine-styles route module
- Frontend auth/client/admin UI:
  - [apps/web/src/api/client.ts](apps/web/src/api/client.ts) -- add authenticated mutation methods
  - [apps/web/src/contexts/AuthContext.tsx](apps/web/src/contexts/AuthContext.tsx) -- extend `AuthUser` with `role`
  - [apps/web/src/components/ProtectedRoute.tsx](apps/web/src/components/ProtectedRoute.tsx) -- add `AdminRoute` (or new file alongside)
  - [apps/web/src/components/landing/Navbar.tsx](apps/web/src/components/landing/Navbar.tsx) -- conditional Admin link
  - [apps/web/src/App.tsx](apps/web/src/App.tsx) -- admin route definitions
  - [apps/web/src/pages/admin/](apps/web/src/pages/admin/) -- **new**: `WineStylesListPage`, `WineStyleCreatePage`, `WineStyleEditPage`
- New MCP package:
  - [packages/mcp-wine](packages/mcp-wine) -- **new**: stdio MCP server

## Implementation plan

### 1. Admin role foundation

- Add `userRoleEnum` (`'user'`, `'admin'`) to [enums.ts](packages/db/src/schema/enums.ts).
- Add `role` column to `user` table in [users.ts](packages/db/src/schema/users.ts), default `'user'`.
- Generate migration in [packages/db/drizzle](packages/db/drizzle).
- Seed strategy in [seed.ts](packages/db/src/seed.ts):
  - All seeded users default to `'user'`.
  - If `ADMIN_EMAIL` env var is set, promote that user to `'admin'` after insert.
- Extend `AccessPayload` in [jwt.ts](apps/api/src/auth/jwt.ts) to include `role: string`.
- Update `signAccess` call sites in [auth/routes.ts](apps/api/src/auth/routes.ts) (register, login, refresh) to:
  - Read the user's current `role` from the DB row.
  - Pass `role` into `signAccess`.
  - Include `role` in the `user` object of the response body.

### 2. Auth guards

- Add `requireAdmin` to [preHandler.ts](apps/api/src/auth/preHandler.ts):
  - Calls `requireAuth` logic first (verify token, set `req.user`).
  - Loads user row by `req.user.userId` from DB.
  - If `role !== 'admin'`, returns `403 { error: "Forbidden", message: "Admin role required" }`.
- `/me` continues returning `req.user` (token payload, now including `role`). The role may be slightly stale here; this is acceptable for a read-only info endpoint -- authorization decisions use the DB check in `requireAdmin`.

### 3. Shared schemas for write API

Add to [schemas.ts](packages/shared/src/schemas.ts):

- `wineStyleIdSchema`: `z.string().min(1).max(64).regex(/^[a-z0-9_]+$/)` -- validates the slug format.
- `wineStyleIdParamSchema`: `z.object({ id: wineStyleIdSchema })` -- for route params.
- `wineStyleCreateSchema`: required fields `id`, `displayName`, `styleType`, `producedColor`; optional `wineCategory` (defaults server-side to `'still'`), `regionId`, `climateMin`, `climateMax`, `climateOrdinalScaleId`, `notes`; optional relation arrays `grapes`, `structure`, `appearance`, `aromaClusters`, `aromaDescriptors`.
- `wineStylePatchSchema`: all fields from create except `id`, all optional, `.strict()`. Relation arrays use replace-on-present semantics.

### 4. API service + CRUD routes (transactional)

**Service extraction** -- create [apps/api/src/services/wineStyles.ts](apps/api/src/services/wineStyles.ts):

- Move `buildWineStyleFull` out of [read.ts](apps/api/src/routes/read.ts) into the new service module. The function signature stays the same (`(styles: WineStyleRow[]) => Promise<WineStyleFull[]>`). Update [read.ts](apps/api/src/routes/read.ts) to import from the service -- the existing `/style-targets` routes remain functionally unchanged.
- Implement `createWineStyle(input)`, `patchWineStyle(id, patch)`, `deleteWineStyle(id)`:
  - Validate FK existence (regionId, climateOrdinalScaleId, grape IDs, dimension IDs, etc.) before write.
  - Each operation runs inside one DB transaction.
  - For `patch`: update only provided core fields; for each relation array present, delete existing + insert new atomically.
  - Return `404` if style not found (patch/delete).

**Route registration** -- create [apps/api/src/routes/wineStyles.ts](apps/api/src/routes/wineStyles.ts):

- `GET /wine-styles` -- calls `buildWineStyleFull`, identical response shape to `/style-targets`. Used by admin UI for listing.
- `GET /wine-styles/:id` -- identical shape to `/style-targets/:id`. Used by admin edit form.
- `POST /wine-styles` -- `requireAdmin`, validates body with `wineStyleCreateSchema`.
- `PATCH /wine-styles/:id` -- `requireAdmin`, validates body with `wineStylePatchSchema`.
- `DELETE /wine-styles/:id` -- `requireAdmin`.

The `/wine-styles` and `/style-targets` routes share `buildWineStyleFull` from the service. They produce the same response shape. The admin UI will use `/wine-styles`; the explore frontend continues using `/style-targets`. Over time, `/style-targets` can be deprecated.

Register the new module in [index.ts](apps/api/src/index.ts).

### 5. Frontend auth and admin UX -- Phase A

- Extend `AuthUser` type in [client.ts](apps/web/src/api/client.ts) with `role?: string`.
- Propagate through [AuthContext.tsx](apps/web/src/contexts/AuthContext.tsx).
- Add authenticated mutation methods to `api` (or a separate `adminApi`) in [client.ts](apps/web/src/api/client.ts): `createWineStyle`, `updateWineStyle`, `deleteWineStyle`. Each accepts an `accessToken` parameter -- no global mutable token holder.
- Add `AdminRoute` component (alongside `ProtectedRoute`):
  - Unauthenticated -> redirect to `/login`.
  - Authenticated but non-admin -> redirect to `/` (or show a lightweight "forbidden" message).
- Add routes in [App.tsx](apps/web/src/App.tsx):
  - `/admin/wine-styles` -- list page with create/edit/delete actions.
  - `/admin/wine-styles/new` -- create form (core fields only in Phase A).
  - `/admin/wine-styles/:id/edit` -- edit form (core fields only in Phase A).
- Add "Admin" link in [Navbar.tsx](apps/web/src/components/landing/Navbar.tsx), visible only when `state.user?.role === 'admin'`.

### 6. Frontend admin UX -- Phase B (relation editors)

- Extend create/edit forms with relation editors for:
  - Grapes (grape picker + optional percentage)
  - Structure (dimension picker + min/max range)
  - Appearance (dimension picker + min/max range)
  - Aroma clusters (cluster picker + intensity range)
  - Aroma descriptors (descriptor picker + salience)
- Each relation section fetches reference data (grapes, dimensions, clusters, descriptors) via existing public read endpoints.
- Uses the same replace-on-present PATCH semantics.

### 7. MCP package (API-backed)

- Create [packages/mcp-wine](packages/mcp-wine) as stdio MCP server using `@modelcontextprotocol/sdk`.
- Tools:
  - `wine_list_styles` -- calls `GET /wine-styles`
  - `wine_get_style` -- calls `GET /wine-styles/:id`
  - `wine_create_style` -- calls `POST /wine-styles`
  - `wine_update_style` -- calls `PATCH /wine-styles/:id`
  - `wine_delete_style` -- calls `DELETE /wine-styles/:id`
- Auth: read tools call public GET. Write tools call `/auth/login` with `WINE_APP_ADMIN_EMAIL` + `WINE_APP_ADMIN_PASSWORD` env vars to get a fresh access token per write call (no caching, stateless).
- Return API error details in normalized tool output (status + message).
- Add README with setup instructions and required env vars.

### 8. Verification gates

- API functional checks:
  - 401 without token, 403 for non-admin, 200/201 for admin writes.
  - 400 for invalid payload/FK, 404 for missing IDs.
  - Slug format validation on create.
- Contract checks:
  - `/style-targets` and `/style-targets/:id` still match current frontend expectations.
  - `/wine-styles` response shape matches `/style-targets` exactly.
- Build/type: `pnpm run build`
- Lint on touched files.
- Manual smoke:
  - Admin can create/edit/delete a style from `/admin/wine-styles`.
  - Non-admin cannot access admin page or write endpoints.

## Execution order

1. DB role enum/column + migration + seed admin promotion.
2. Auth payload/response role + `requireAdmin` DB check.
3. Shared write schemas.
4. Extract `buildWineStyleFull` to service + API transactional CRUD + route registration.
5. Frontend role plumbing + AdminRoute + Phase A admin UI (core fields).
6. Phase B relation editors on admin forms.
7. MCP package with login-per-write auth.
8. Full verification pass.

## Risks and mitigations

- **Role drift between token and DB:** mitigated by DB check in `requireAdmin`; `/me` may show stale role, acceptable for read-only display.
- **Partial write corruption:** mitigated with transactions.
- **Contract regressions for existing pages:** mitigated by preserving `/style-targets` handlers and sharing `buildWineStyleFull` from the same service.
- **MCP auth fragility:** mitigated by programmatic login per write, no token caching.
- **Slug collisions on create:** mitigated by DB unique PK constraint + 400 error on conflict.
# @wine-app/mcp-wine

MCP (Model Context Protocol) server for the Wine App API. Exposes read/write tools for wine styles over stdio. Write operations authenticate per call via `/auth/login` using environment credentials (no token caching).

## Setup

1. **Build** (from repo root):

   ```bash
   pnpm --filter @wine-app/mcp-wine build
   ```

2. **Environment variables**

   - `WINE_APP_API_URL` (optional) – API base URL. Default: `http://localhost:3000`
   - `WINE_APP_ADMIN_EMAIL` (optional in local dev) – defaults to `admin@example.com`
   - `WINE_APP_ADMIN_PASSWORD` (optional in local dev) – defaults to `admin123`

   Read-only tools (`wine_list_styles`, `wine_get_style`) do not require admin env vars.

   **Important:** For production (e.g. Fly.io), explicitly set `WINE_APP_ADMIN_EMAIL` and `WINE_APP_ADMIN_PASSWORD` as secrets. Do not rely on defaults outside local development.

## Tools

| Tool                 | Auth   | Description                          |
|----------------------|--------|--------------------------------------|
| `wine_list_styles`   | No     | List all wine styles (GET /wine-styles) |
| `wine_get_style`     | No     | Get one wine style by id             |
| `wine_create_style`  | Yes    | Create a wine style (POST body)      |
| `wine_update_style`  | Yes    | Update a wine style (PATCH body)     |
| `wine_delete_style`  | Yes    | Delete a wine style by id            |

Tool responses are normalized as JSON: `{ success, data?, status?, message? }`. On error, `success` is false and `message` or `status` carry API error details.

## Cursor / MCP client

Add the server in your MCP config (e.g. Cursor settings → MCP) so the client runs the server process with stdio and passes env:

```json
{
  "mcpServers": {
    "wine-app": {
      "command": "node",
      "args": ["/path/to/wine-app/packages/mcp-wine/dist/index.js"],
      "env": {
        "WINE_APP_API_URL": "http://localhost:3000",
        "WINE_APP_ADMIN_EMAIL": "your-admin@example.com",
        "WINE_APP_ADMIN_PASSWORD": "your-secure-password"
      }
    }
  }
}
```

Or from the monorepo root:

```bash
pnpm --filter @wine-app/mcp-wine start
```

Ensure `WINE_APP_ADMIN_EMAIL` corresponds to a user promoted to admin.

For local development, the DB seed uses `ADMIN_EMAIL` with fallback `admin@example.com`. A typical local flow is:

```bash
# 1) Start DB + run migrate + seed
pnpm db:up

# 2) Register/login in the app as admin@example.com (or your ADMIN_EMAIL)

# 3) Promote that account to admin
ADMIN_EMAIL="admin@example.com" pnpm --filter db run seed
```

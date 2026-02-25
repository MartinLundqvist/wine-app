#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.WINE_APP_API_URL ?? "http://localhost:3000";
const ADMIN_EMAIL =
  process.env.WINE_APP_ADMIN_EMAIL ?? "iphonelynden@gmail.com";
const ADMIN_PASSWORD = process.env.WINE_APP_ADMIN_PASSWORD ?? "wine";

async function getAccessToken(): Promise<string> {
  if (
    !process.env.WINE_APP_ADMIN_EMAIL ||
    !process.env.WINE_APP_ADMIN_PASSWORD
  ) {
    console.warn(
      "[mcp-wine] Using default admin credentials for local development. Set WINE_APP_ADMIN_EMAIL and WINE_APP_ADMIN_PASSWORD in production.",
    );
  }
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? `Login failed: ${res.status}`,
    );
  }
  const data = (await res.json()) as { accessToken?: string };
  if (!data.accessToken) throw new Error("No access token in login response");
  return data.accessToken;
}

function normalizeResult(
  ok: boolean,
  data?: unknown,
  status?: number,
  message?: string,
): string {
  return JSON.stringify(
    { success: ok, ...(data !== undefined && { data }), status, message },
    null,
    2,
  );
}

const server = new McpServer({
  name: "mcp-wine",
  version: "0.0.0",
});

// Read tools (no auth)
server.registerTool(
  "wine_list_styles",
  {
    description: "List all wine styles (same shape as /style-targets)",
    inputSchema: {},
  },
  async () => {
    try {
      const res = await fetch(`${API_BASE}/wine-styles`);
      const text = await res.text();
      if (!res.ok) {
        let err: { message?: string; error?: string } = {};
        try {
          err = text ? JSON.parse(text) : {};
        } catch {
          err = { message: res.statusText };
        }
        return {
          content: [
            {
              type: "text" as const,
              text: normalizeResult(
                false,
                undefined,
                res.status,
                err.message ?? err.error ?? res.statusText,
              ),
            },
          ],
        };
      }
      const data = JSON.parse(text);
      return {
        content: [{ type: "text" as const, text: normalizeResult(true, data) }],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: normalizeResult(
              false,
              undefined,
              undefined,
              e instanceof Error ? e.message : String(e),
            ),
          },
        ],
      };
    }
  },
);

server.registerTool(
  "wine_get_style",
  {
    description: "Get a single wine style by id",
    inputSchema: { id: z.string().describe("Wine style id (slug)") },
  },
  async ({ id }) => {
    try {
      const res = await fetch(
        `${API_BASE}/wine-styles/${encodeURIComponent(id)}`,
      );
      const text = await res.text();
      if (!res.ok) {
        let err: { message?: string; error?: string } = {};
        try {
          err = text ? JSON.parse(text) : {};
        } catch {
          err = { message: res.statusText };
        }
        return {
          content: [
            {
              type: "text" as const,
              text: normalizeResult(
                false,
                undefined,
                res.status,
                err.message ?? err.error ?? res.statusText,
              ),
            },
          ],
        };
      }
      const data = JSON.parse(text);
      return {
        content: [{ type: "text" as const, text: normalizeResult(true, data) }],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: normalizeResult(
              false,
              undefined,
              undefined,
              e instanceof Error ? e.message : String(e),
            ),
          },
        ],
      };
    }
  },
);

// Write tools (login per call)
server.registerTool(
  "wine_create_style",
  {
    description:
      "Create a new wine style. Requires WINE_APP_ADMIN_EMAIL and WINE_APP_ADMIN_PASSWORD.",
    inputSchema: {
      body: z.record(z.unknown()).describe("JSON body for POST /wine-styles"),
    },
  },
  async ({ body }) => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/wine-styles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let errBody: { message?: string; error?: string } = {};
      try {
        errBody = text ? JSON.parse(text) : {};
      } catch {
        errBody = { message: res.statusText };
      }
      if (!res.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: normalizeResult(
                false,
                undefined,
                res.status,
                errBody.message ?? errBody.error ?? res.statusText,
              ),
            },
          ],
        };
      }
      const data = text ? JSON.parse(text) : undefined;
      return {
        content: [{ type: "text" as const, text: normalizeResult(true, data) }],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: normalizeResult(
              false,
              undefined,
              undefined,
              e instanceof Error ? e.message : String(e),
            ),
          },
        ],
      };
    }
  },
);

server.registerTool(
  "wine_update_style",
  {
    description:
      "Update a wine style by id (PATCH). Requires WINE_APP_ADMIN_EMAIL and WINE_APP_ADMIN_PASSWORD.",
    inputSchema: {
      id: z.string().describe("Wine style id (slug)"),
      body: z
        .record(z.unknown())
        .describe("JSON body for PATCH /wine-styles/:id"),
    },
  },
  async ({ id, body }) => {
    try {
      const token = await getAccessToken();
      const res = await fetch(
        `${API_BASE}/wine-styles/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );
      const text = await res.text();
      let errBody: { message?: string; error?: string } = {};
      try {
        errBody = text ? JSON.parse(text) : {};
      } catch {
        errBody = { message: res.statusText };
      }
      if (!res.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: normalizeResult(
                false,
                undefined,
                res.status,
                errBody.message ?? errBody.error ?? res.statusText,
              ),
            },
          ],
        };
      }
      const data = text ? JSON.parse(text) : undefined;
      return {
        content: [{ type: "text" as const, text: normalizeResult(true, data) }],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: normalizeResult(
              false,
              undefined,
              undefined,
              e instanceof Error ? e.message : String(e),
            ),
          },
        ],
      };
    }
  },
);

server.registerTool(
  "wine_delete_style",
  {
    description:
      "Delete a wine style by id. Requires WINE_APP_ADMIN_EMAIL and WINE_APP_ADMIN_PASSWORD.",
    inputSchema: {
      id: z.string().describe("Wine style id (slug)"),
    },
  },
  async ({ id }) => {
    try {
      const token = await getAccessToken();
      const res = await fetch(
        `${API_BASE}/wine-styles/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok && res.status !== 204) {
        const text = await res.text();
        let errBody: { message?: string; error?: string } = {};
        try {
          errBody = text ? JSON.parse(text) : {};
        } catch {
          errBody = { message: res.statusText };
        }
        return {
          content: [
            {
              type: "text" as const,
              text: normalizeResult(
                false,
                undefined,
                res.status,
                errBody.message ?? errBody.error ?? res.statusText,
              ),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: normalizeResult(true, { deleted: id }),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: normalizeResult(
              false,
              undefined,
              undefined,
              e instanceof Error ? e.message : String(e),
            ),
          },
        ],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

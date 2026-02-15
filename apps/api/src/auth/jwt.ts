import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-min-32-characters-long";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-min-32-chars";
const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";

export type AccessPayload = { userId: string; email: string; type: "access" };
export type RefreshPayload = { userId: string; type: "refresh" };

export function signAccess(payload: Omit<AccessPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" } as AccessPayload, JWT_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefresh(payload: Omit<RefreshPayload, "type">): string {
  return jwt.sign({ ...payload, type: "refresh" } as RefreshPayload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

export function verifyAccess(token: string): AccessPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as AccessPayload;
  if (decoded.type !== "access") throw new Error("Invalid token type");
  return decoded;
}

export function verifyRefresh(token: string): RefreshPayload {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshPayload;
  if (decoded.type !== "refresh") throw new Error("Invalid token type");
  return decoded;
}

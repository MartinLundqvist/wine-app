import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "@wine-app/db";
import { user } from "@wine-app/db/schema";
import { eq } from "drizzle-orm";
import { verifyAccess, type AccessPayload } from "./jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AccessPayload;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return reply.status(401).send({ error: "Authorization required" });
  }
  try {
    req.user = verifyAccess(token);
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if (reply.sent) return;
  const [row] = await db.select({ role: user.role }).from(user).where(eq(user.userId, req.user!.userId)).limit(1);
  if (!row || row.role !== "admin") {
    return reply.status(403).send({ error: "Forbidden", message: "Admin role required" });
  }
}

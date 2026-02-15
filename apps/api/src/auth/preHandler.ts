import type { FastifyRequest, FastifyReply } from "fastify";
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

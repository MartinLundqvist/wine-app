import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import { db } from "@wine-app/db";
import { user } from "@wine-app/db/schema";
import { eq } from "drizzle-orm";
import { signAccess, signRefresh, verifyRefresh } from "./jwt.js";

const SALT_ROUNDS = 10;
const REFRESH_COOKIE = "refresh_token";

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post<{
    Body: { email?: string; password?: string; displayName?: string };
  }>("/auth/register", async (req, reply) => {
    const { email, password, displayName } = req.body ?? {};
    if (!email || !password) {
      return reply.status(400).send({ error: "email and password required" });
    }
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existing.length > 0) {
      return reply.status(409).send({ error: "email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [created] = await db
      .insert(user)
      .values({
        email,
        passwordHash,
        displayName: displayName ?? null,
      })
      .returning();
    if (!created) return reply.status(500).send({ error: "Failed to create user" });
    const accessToken = signAccess({ userId: created.userId, email: created.email });
    const refreshToken = signRefresh({ userId: created.userId });
    setRefreshCookie(reply, refreshToken);
    return reply.send({ accessToken, user: { userId: created.userId, email: created.email, displayName: created.displayName ?? undefined } });
  });

  app.post<{
    Body: { email?: string; password?: string };
  }>("/auth/login", async (req, reply) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return reply.status(400).send({ error: "email and password required" });
    }
    const [found] = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (!found || !(await bcrypt.compare(password, found.passwordHash))) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }
    await db
      .update(user)
      .set({ lastActiveAt: new Date() })
      .where(eq(user.userId, found.userId));
    const accessToken = signAccess({ userId: found.userId, email: found.email });
    const refreshToken = signRefresh({ userId: found.userId });
    setRefreshCookie(reply, refreshToken);
    return reply.send({
      accessToken,
      user: {
        userId: found.userId,
        email: found.email,
        displayName: found.displayName ?? undefined,
      },
    });
  });

  app.post("/auth/refresh", async (req, reply) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return reply.status(401).send({ error: "No refresh token" });
    try {
      const payload = verifyRefresh(token);
      const [found] = await db.select().from(user).where(eq(user.userId, payload.userId)).limit(1);
      if (!found) return reply.status(401).send({ error: "User not found" });
      const accessToken = signAccess({ userId: found.userId, email: found.email });
      const newRefresh = signRefresh({ userId: found.userId });
      setRefreshCookie(reply, newRefresh);
      return reply.send({
        accessToken,
        user: {
          userId: found.userId,
          email: found.email,
          displayName: found.displayName ?? undefined,
        },
      });
    } catch {
      clearRefreshCookie(reply);
      return reply.status(401).send({ error: "Invalid refresh token" });
    }
  });

  app.post("/auth/logout", async (_req, reply) => {
    clearRefreshCookie(reply);
    return reply.send({ ok: true });
  });
}

function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE, { path: "/" });
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "@wine-app/db";
import { userProgress } from "@wine-app/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../auth/preHandler.js";

export async function registerProgressRoutes(app: FastifyInstance) {
  app.get(
    "/progress",
    { preHandler: [requireAuth] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const userId = req.user?.userId;
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });
      const rows = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));
      return reply.send(rows);
    }
  );
}

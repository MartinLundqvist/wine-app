import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "../auth/preHandler.js";

/**
 * Exercise routes (generate, submit) are temporarily stubbed during the
 * wine knowledge engine v4 schema migration. Maps, drills, and progress
 * will be reimplemented against the new schema later.
 * Use the Explore UI to browse the wine database.
 */
export async function registerExerciseRoutes(app: FastifyInstance) {
  app.post<{
    Body: { mapId?: string; templateId?: string; exclude?: string[] };
  }>(
    "/exercise/generate",
    { preHandler: [requireAuth] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: "Exercise generation is temporarily disabled during schema migration. Use Explore to browse the wine database.",
      });
    },
  );

  app.post<{
    Body: { templateId?: string; payload?: object; userAnswer?: object };
  }>(
    "/exercise/submit",
    { preHandler: [requireAuth] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      return reply.status(501).send({
        error: "Exercise submit is temporarily disabled during schema migration.",
      });
    },
  );
}

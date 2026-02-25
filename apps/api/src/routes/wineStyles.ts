import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "@wine-app/db";
import { wineStyle } from "@wine-app/db/schema";
import { eq } from "drizzle-orm";
import {
  wineStyleCreateSchema,
  wineStylePatchSchema,
  wineStyleIdParamSchema,
} from "@wine-app/shared";
import { requireAdmin } from "../auth/preHandler.js";
import {
  buildWineStyleFull,
  createWineStyle,
  patchWineStyle,
  deleteWineStyle,
} from "../services/wineStyles.js";

export async function registerWineStylesRoutes(app: FastifyInstance) {
  app.get("/wine-styles", async (_req: FastifyRequest, reply: FastifyReply) => {
    const styles = await db
      .select()
      .from(wineStyle)
      .orderBy(wineStyle.displayName);
    const result = await buildWineStyleFull(styles);
    return reply.send(result);
  });

  app.get<{ Params: { id: string } }>(
    "/wine-styles/:id",
    async (req, reply) => {
      const parsed = wineStyleIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid id", details: parsed.error.flatten() });
      }
      const { id } = parsed.data;
      const [style] = await db
        .select()
        .from(wineStyle)
        .where(eq(wineStyle.id, id))
        .limit(1);
      if (!style) return reply.status(404).send({ error: "Wine style not found" });
      const [full] = await buildWineStyleFull([style]);
      return reply.send(full);
    }
  );

  app.post<{ Body: unknown }>(
    "/wine-styles",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const parsed = wineStyleCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });
      }
      try {
        const created = await createWineStyle(parsed.data);
        return reply.status(201).send(created);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Create failed";
        if (message.includes("not found") || message.includes("duplicate") || message.includes("unique")) {
          return reply.status(400).send({ error: "Bad request", message });
        }
        req.log?.error?.(err, "Wine style create failed");
        throw err;
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: unknown }>(
    "/wine-styles/:id",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const paramParsed = wineStyleIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        return reply.status(400).send({ error: "Invalid id", details: paramParsed.error.flatten() });
      }
      const bodyParsed = wineStylePatchSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        return reply.status(400).send({ error: "Validation failed", details: bodyParsed.error.flatten() });
      }
      const { id } = paramParsed.data;
      try {
        const updated = await patchWineStyle(id, bodyParsed.data);
        if (updated === null) return reply.status(404).send({ error: "Wine style not found" });
        return reply.send(updated);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Update failed";
        if (message.includes("not found")) {
          return reply.status(400).send({ error: "Bad request", message });
        }
        throw err;
      }
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/wine-styles/:id",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const parsed = wineStyleIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid id", details: parsed.error.flatten() });
      }
      const { id } = parsed.data;
      const deleted = await deleteWineStyle(id);
      if (!deleted) return reply.status(404).send({ error: "Wine style not found" });
      return reply.status(204).send();
    }
  );
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "@wine-app/db";
import {
  grape,
  styleTarget,
  styleTargetAttribute,
  attribute,
  descriptor,
  styleTargetDescriptor,
  exerciseTemplate,
} from "@wine-app/db/schema";
export async function registerReadRoutes(app: FastifyInstance) {
  app.get("/grapes", async (_req: FastifyRequest, reply: FastifyReply) => {
    const rows = await db.select().from(grape).orderBy(grape.grapeId);
    return reply.send(rows);
  });

  app.get("/style-targets", async (_req: FastifyRequest, reply: FastifyReply) => {
    const targets = await db.select().from(styleTarget).orderBy(styleTarget.styleTargetId);
    const attrs = await db.select().from(styleTargetAttribute);
    const attrMap = new Map<string, Record<string, number | string>>();
    for (const a of attrs) {
      const key = a.styleTargetId;
      if (!attrMap.has(key)) attrMap.set(key, {});
      const rec = attrMap.get(key)!;
      const val = a.valueOrdinal ?? a.valueCategorical;
      if (val != null) rec[a.attributeId] = val;
    }
    const result = targets.map((t: (typeof targets)[number]) => ({
      ...t,
      attributes: attrMap.get(t.styleTargetId) ?? {},
    }));
    return reply.send(result);
  });

  app.get("/attributes", async (_req: FastifyRequest, reply: FastifyReply) => {
    const rows = await db.select().from(attribute).orderBy(attribute.sortOrder);
    return reply.send(rows);
  });

  app.get("/descriptors", async (_req: FastifyRequest, reply: FastifyReply) => {
    const descs = await db.select().from(descriptor).orderBy(descriptor.descriptorId);
    const links = await db.select().from(styleTargetDescriptor);
    const stMap = new Map<string, string[]>();
    for (const l of links) {
      const arr = stMap.get(l.descriptorId) ?? [];
      arr.push(l.styleTargetId);
      stMap.set(l.descriptorId, arr);
    }
    const result = descs.map((d: (typeof descs)[number]) => ({
      ...d,
      styleTargetIds: stMap.get(d.descriptorId) ?? [],
    }));
    return reply.send(result);
  });

  app.get("/exercise-templates", async (_req: FastifyRequest, reply: FastifyReply) => {
    const rows = await db
      .select()
      .from(exerciseTemplate)
      .orderBy(exerciseTemplate.exerciseTemplateId);
    return reply.send(rows);
  });
}

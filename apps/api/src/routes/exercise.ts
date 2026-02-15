import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "@wine-app/db";
import {
  styleTarget,
  styleTargetAttribute,
  exerciseTemplate,
  exerciseInstance,
  userProgress,
} from "@wine-app/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../auth/preHandler.js";

const MAP_CONFIGS: Record<
  string,
  { xAttr: string; yAttr: string; wineColor: "red" | "white" }
> = {
  "red-structure": { xAttr: "tannin", yAttr: "acidity", wineColor: "red" },
  "body-alcohol": { xAttr: "alcohol", yAttr: "body", wineColor: "red" },
  "flavor-direction": {
    xAttr: "fruit_profile",
    yAttr: "fruit_forward_index",
    wineColor: "red",
  },
  "white-structure": { xAttr: "body", yAttr: "acidity", wineColor: "white" },
};

export async function registerExerciseRoutes(app: FastifyInstance) {
  app.post<{
    Body: { mapId?: string; templateId?: string; exclude?: string[] };
  }>(
    "/exercise/generate",
    { preHandler: [requireAuth] },
    async (
      req: FastifyRequest<{ Body: { mapId?: string; templateId?: string; exclude?: string[] } }>,
      reply: FastifyReply,
    ) => {
      const userId = req.user?.userId;
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });
      const { mapId, templateId, exclude } = req.body ?? {};
      const template = templateId
        ? (
            await db
              .select()
              .from(exerciseTemplate)
              .where(eq(exerciseTemplate.exerciseTemplateId, templateId))
              .limit(1)
          )[0]
        : null;
      const mapConfig = mapId ? MAP_CONFIGS[mapId] : null;
      if (!mapConfig && !template) {
        return reply
          .status(400)
          .send({ error: "mapId or templateId required" });
      }
      const config = mapConfig ?? {
        xAttr: "tannin",
        yAttr: "acidity",
        wineColor: "red" as const,
      };
      const allTargets = await db
        .select()
        .from(styleTarget)
        .where(eq(styleTarget.wineColor, config.wineColor));
      if (allTargets.length === 0)
        return reply.status(500).send({ error: "No style targets" });
      const totalAvailable = allTargets.length;
      // Filter out already-seen targets; fall back to full list if all excluded
      const excludeSet = new Set(exclude ?? []);
      const remaining = allTargets.filter((t) => !excludeSet.has(t.styleTargetId));
      const pool = remaining.length > 0 ? remaining : allTargets;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      const attrs = await db
        .select()
        .from(styleTargetAttribute)
        .where(eq(styleTargetAttribute.styleTargetId, chosen.styleTargetId));
      const attrMap: Record<string, number | string> = {};
      for (const a of attrs) {
        const v = a.valueOrdinal ?? a.valueCategorical;
        if (v != null) attrMap[a.attributeId] = v;
      }
      const xVal = attrMap[config.xAttr];
      const yVal = attrMap[config.yAttr];
      const seed = Math.floor(Math.random() * 1e6);
      const correctX = typeof xVal === "number" ? xVal : 2;
      const correctY = typeof yVal === "number" ? yVal : 2;
      const payload = {
        mapId: mapId ?? "red-structure",
        xAttr: config.xAttr,
        yAttr: config.yAttr,
        correctStyleTargetId: chosen.styleTargetId,
        correctName: chosen.name,
        correctPosition: { x: correctX, y: correctY },
        seed,
      };
      return reply.send({
        payload,
        totalAvailable,
        templateId: template?.exerciseTemplateId ?? "map_place_red_structure",
      });
    },
  );

  app.post<{
    Body: {
      templateId?: string;
      payload?: {
        correctStyleTargetId: string;
        correctPosition: { x: number; y: number };
      };
      userAnswer: { x: number; y: number };
    };
  }>(
    "/exercise/submit",
    { preHandler: [requireAuth] },
    async (
      req: FastifyRequest<{
        Body: {
          templateId?: string;
          payload?: {
            correctStyleTargetId: string;
            correctPosition: { x: number; y: number };
          };
          userAnswer: { x: number; y: number };
        };
      }>,
      reply: FastifyReply,
    ) => {
      const userId = req.user?.userId;
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });
      const { payload, userAnswer } = req.body ?? {};
      if (!payload?.correctPosition || !userAnswer) {
        return reply
          .status(400)
          .send({ error: "payload and userAnswer required" });
      }
      const { correctPosition } = payload;
      const dx = Math.abs((userAnswer.x ?? 0) - correctPosition.x);
      const dy = Math.abs((userAnswer.y ?? 0) - correctPosition.y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const isCorrect = dx === 0 && dy === 0;
      const score = Math.max(0, 1 - distance / 3);
      const templateId = req.body.templateId ?? "map_place_red_structure";
      await db.insert(exerciseInstance).values({
        userId,
        exerciseTemplateId: templateId,
        seed: (payload as { seed?: number }).seed ?? 0,
        payload: payload as object,
        userAnswer: userAnswer as object,
        isCorrect,
        score,
      });
      const wineColor = ((payload as { wineColor?: string }).wineColor ??
        "red") as "red" | "white" | "mixed";
      const format = "map_place";
      const existing = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.exerciseFormat, format),
            eq(userProgress.wineColor, wineColor),
          ),
        )
        .limit(1);
      const row = existing[0];
      if (row) {
        const totalAttempts = row.totalAttempts + 1;
        const correctAttempts = row.correctAttempts + (isCorrect ? 1 : 0);
        const accuracy = correctAttempts / totalAttempts;
        const masteryState =
          accuracy >= 0.8 && totalAttempts >= 10 ? "mastered" : "in_progress";
        await db
          .update(userProgress)
          .set({
            totalAttempts,
            correctAttempts,
            accuracy,
            masteryState: masteryState as "in_progress" | "mastered",
            lastAttemptedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userProgress.userId, userId),
              eq(userProgress.exerciseFormat, format),
              eq(userProgress.wineColor, wineColor),
            ),
          );
      } else {
        await db.insert(userProgress).values({
          userId,
          exerciseFormat: format,
          wineColor,
          totalAttempts: 1,
          correctAttempts: isCorrect ? 1 : 0,
          accuracy: isCorrect ? 1 : 0,
          masteryState: "in_progress",
          lastAttemptedAt: new Date(),
        });
      }
      return reply.send({
        isCorrect,
        score,
        correctPosition,
        feedback: {
          structureMatch: isCorrect
            ? "Correct placement."
            : `You placed at (${userAnswer.x}, ${userAnswer.y}). Correct was (${correctPosition.x}, ${correctPosition.y}).`,
        },
      });
    },
  );
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "@wine-app/db";
import {
  styleTarget,
  styleTargetAttribute,
  exerciseTemplate,
  exerciseInstance,
  userProgress,
  descriptor,
  styleTargetDescriptor,
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

const MAP_ID_TO_TEMPLATE: Record<string, string> = {
  "red-structure": "map_place_red_structure",
  "body-alcohol": "map_place_red_structure",
  "flavor-direction": "map_place_red_structure",
  "white-structure": "map_place_white_structure",
};

export async function registerExerciseRoutes(app: FastifyInstance) {
  app.post<{
    Body: { mapId?: string; templateId?: string; exclude?: string[] };
  }>(
    "/exercise/generate",
    { preHandler: [requireAuth] },
    async (
      req: FastifyRequest<{
        Body: { mapId?: string; templateId?: string; exclude?: string[] };
      }>,
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

      const wineColor = (template?.wineColor ??
        mapConfig?.wineColor ??
        "red") as "red" | "white";
      const allTargets = await db
        .select()
        .from(styleTarget)
        .where(eq(styleTarget.wineColor, wineColor));
      if (allTargets.length === 0)
        return reply.status(500).send({ error: "No style targets" });
      const totalAvailable = allTargets.length;

      if (
        template &&
        [
          "descriptor_match",
          "elimination",
          "map_recall",
          "skeleton_deduction",
        ].includes(template.format)
      ) {
        const seed = Math.floor(Math.random() * 1e6);
        const excludeSet = new Set(exclude ?? []);
        const remaining = allTargets.filter(
          (t) => !excludeSet.has(t.styleTargetId),
        );
        const pool = remaining.length > 0 ? remaining : allTargets;
        const chosen = pool[Math.floor(Math.random() * pool.length)];

        if (template.format === "descriptor_match") {
          const stdRows = await db
            .select()
            .from(styleTargetDescriptor)
            .where(
              eq(styleTargetDescriptor.styleTargetId, chosen.styleTargetId),
            );
          const descriptorIds = stdRows.map((r) => r.descriptorId);
          if (descriptorIds.length === 0)
            return reply
              .status(500)
              .send({ error: "No descriptors for chosen target" });
          const clueDescId =
            descriptorIds[Math.floor(Math.random() * descriptorIds.length)];
          const [clueDesc] = await db
            .select()
            .from(descriptor)
            .where(eq(descriptor.descriptorId, clueDescId))
            .limit(1);
          const distractors = allTargets.filter(
            (t) => t.styleTargetId !== chosen.styleTargetId,
          );
          const shuffled = [...distractors].sort(() => Math.random() - 0.5);
          const options = [chosen, ...shuffled.slice(0, 3)].map((t) => ({
            styleTargetId: t.styleTargetId,
            name: t.name,
          }));
          const shuffledOptions = options.sort(() => Math.random() - 0.5);
          const payload = {
            format: "descriptor_match",
            correctStyleTargetId: chosen.styleTargetId,
            correctName: chosen.name,
            descriptorClue: {
              descriptorId: clueDescId,
              name: clueDesc?.name ?? clueDescId,
            },
            options: shuffledOptions,
            wineColor,
            seed,
          };
          return reply.send({
            payload,
            totalAvailable,
            templateId: template.exerciseTemplateId,
          });
        }

        if (template.format === "elimination") {
          const distractors = allTargets.filter(
            (t) => t.styleTargetId !== chosen.styleTargetId,
          );
          const shuffled = [...distractors].sort(() => Math.random() - 0.5);
          const options = [chosen, ...shuffled.slice(0, 2)].map((t) => ({
            styleTargetId: t.styleTargetId,
            name: t.name,
          }));
          const shuffledOptions = options.sort(() => Math.random() - 0.5);
          const payload = {
            format: "elimination",
            correctStyleTargetId: chosen.styleTargetId,
            correctName: chosen.name,
            options: shuffledOptions,
            wineColor,
            seed,
          };
          return reply.send({
            payload,
            totalAvailable,
            templateId: template.exerciseTemplateId,
          });
        }

        if (template.format === "map_recall") {
          const mapIdRecall =
            wineColor === "white" ? "white-structure" : "red-structure";
          const configRecall = MAP_CONFIGS[mapIdRecall];
          const styleTargetsWithPos: {
            styleTargetId: string;
            name: string;
            correctPosition: { x: number; y: number };
          }[] = [];
          for (const t of allTargets) {
            const attrs = await db
              .select()
              .from(styleTargetAttribute)
              .where(eq(styleTargetAttribute.styleTargetId, t.styleTargetId));
            const attrMap: Record<string, number | string> = {};
            for (const a of attrs) {
              const v = a.valueOrdinal ?? a.valueCategorical;
              if (v != null) attrMap[a.attributeId] = v;
            }
            let cx: number;
            let cy: number;
            if (
              configRecall!.xAttr === "fruit_profile" &&
              configRecall!.yAttr === "fruit_forward_index"
            ) {
              const fi = (attrMap.fruit_intensity as number) ?? 3;
              const es = (attrMap.earth_spice_character as number) ?? 2;
              const h = (attrMap.herbal_character as number) ?? 1;
              const ffi = fi - es * 0.5 - h * 0.5;
              const fp = String(attrMap.fruit_profile ?? "Red").trim();
              cx = fp.toLowerCase() === "black" ? 2 : 1;
              cy = Math.min(
                5,
                Math.max(1, Math.round(1 + ((ffi + 1) / 5) * 4)),
              );
            } else {
              const xVal = attrMap[configRecall!.xAttr];
              const yVal = attrMap[configRecall!.yAttr];
              cx = typeof xVal === "number" ? xVal : 2;
              cy = typeof yVal === "number" ? yVal : 2;
            }
            styleTargetsWithPos.push({
              styleTargetId: t.styleTargetId,
              name: t.name,
              correctPosition: { x: cx, y: cy },
            });
          }
          const payload = {
            format: "map_recall",
            mapId: mapIdRecall,
            xAttr: configRecall!.xAttr,
            yAttr: configRecall!.yAttr,
            styleTargets: styleTargetsWithPos,
            wineColor,
            seed,
          };
          return reply.send({
            payload,
            totalAvailable,
            templateId: template.exerciseTemplateId,
          });
        }

        if (template.format === "skeleton_deduction") {
          const attrs = await db
            .select()
            .from(styleTargetAttribute)
            .where(
              eq(styleTargetAttribute.styleTargetId, chosen.styleTargetId),
            );
          const attrMap: Record<string, number | string> = {};
          for (const a of attrs) {
            const v = a.valueOrdinal ?? a.valueCategorical;
            if (v != null) attrMap[a.attributeId] = v;
          }
          const structureClues =
            wineColor === "red"
              ? {
                  tannin: (attrMap.tannin as number) ?? 2,
                  acidity: (attrMap.acidity as number) ?? 2,
                  body: (attrMap.body as number) ?? 2,
                }
              : {
                  body: (attrMap.body as number) ?? 2,
                  acidity: (attrMap.acidity as number) ?? 2,
                };
          const distractors = allTargets.filter(
            (t) => t.styleTargetId !== chosen.styleTargetId,
          );
          const shuffled = [...distractors].sort(() => Math.random() - 0.5);
          const options = [chosen, ...shuffled.slice(0, 2)].map((t) => ({
            styleTargetId: t.styleTargetId,
            name: t.name,
          }));
          const shuffledOptions = options.sort(() => Math.random() - 0.5);
          const payload = {
            format: "skeleton_deduction",
            correctStyleTargetId: chosen.styleTargetId,
            correctName: chosen.name,
            structureClues,
            options: shuffledOptions,
            wineColor,
            seed,
          };
          return reply.send({
            payload,
            totalAvailable,
            templateId: template.exerciseTemplateId,
          });
        }
      }

      const config = mapConfig ?? {
        xAttr: "tannin",
        yAttr: "acidity",
        wineColor: "red" as const,
      };
      const excludeSet = new Set(exclude ?? []);
      const remaining = allTargets.filter(
        (t) => !excludeSet.has(t.styleTargetId),
      );
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
      let correctX: number;
      let correctY: number;
      if (
        mapId === "flavor-direction" &&
        config.xAttr === "fruit_profile" &&
        config.yAttr === "fruit_forward_index"
      ) {
        const fruitIntensity = (attrMap.fruit_intensity as number) ?? 3;
        const earthSpice = (attrMap.earth_spice_character as number) ?? 2;
        const herbal = (attrMap.herbal_character as number) ?? 1;
        const fruitForwardIndex =
          fruitIntensity - earthSpice * 0.5 - herbal * 0.5;
        const fruitProfile = String(attrMap.fruit_profile ?? "Red").trim();
        correctX = fruitProfile.toLowerCase() === "black" ? 2 : 1;
        const normalizedY = Math.min(
          5,
          Math.max(1, Math.round(1 + ((fruitForwardIndex + 1) / 5) * 4)),
        );
        correctY = normalizedY;
      } else {
        const xVal = attrMap[config.xAttr];
        const yVal = attrMap[config.yAttr];
        correctX = typeof xVal === "number" ? xVal : 2;
        correctY = typeof yVal === "number" ? yVal : 2;
      }
      const seed = Math.floor(Math.random() * 1e6);
      const payload = {
        mapId: mapId ?? "red-structure",
        xAttr: config.xAttr,
        yAttr: config.yAttr,
        correctStyleTargetId: chosen.styleTargetId,
        correctName: chosen.name,
        correctPosition: { x: correctX, y: correctY },
        seed,
        wineColor: config.wineColor,
      };
      const resolvedTemplateId =
        template?.exerciseTemplateId ??
        (mapId
          ? (MAP_ID_TO_TEMPLATE[mapId] ?? "map_place_red_structure")
          : "map_place_red_structure");
      return reply.send({
        payload,
        totalAvailable,
        templateId: resolvedTemplateId,
      });
    },
  );

  app.post<{
    Body: {
      templateId?: string;
      payload?: object;
      userAnswer?: object;
    };
  }>(
    "/exercise/submit",
    { preHandler: [requireAuth] },
    async (
      req: FastifyRequest<{
        Body: { templateId?: string; payload?: object; userAnswer?: object };
      }>,
      reply: FastifyReply,
    ) => {
      const userId = req.user?.userId;
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });
      const { templateId: tid, payload, userAnswer } = req.body ?? {};
      if (!payload || !userAnswer) {
        return reply
          .status(400)
          .send({ error: "payload and userAnswer required" });
      }
      const templateId = tid ?? "map_place_red_structure";
      const [template] = await db
        .select()
        .from(exerciseTemplate)
        .where(eq(exerciseTemplate.exerciseTemplateId, templateId))
        .limit(1);
      const format = (template?.format ?? "map_place") as string;
      const wineColor = ((payload as { wineColor?: string }).wineColor ??
        template?.wineColor ??
        "red") as "red" | "white" | "mixed";

      let isCorrect: boolean;
      let score: number;
      let feedback: { structureMatch?: string; [k: string]: unknown };

      if (format === "map_place") {
        const correctPosition = (
          payload as { correctPosition?: { x: number; y: number } }
        ).correctPosition;
        const ua = userAnswer as { x?: number; y?: number };
        if (!correctPosition || ua.x == null || ua.y == null) {
          return reply
            .status(400)
            .send({
              error:
                "map_place requires correctPosition and userAnswer { x, y }",
            });
        }
        const dx = Math.abs((ua.x ?? 0) - correctPosition.x);
        const dy = Math.abs((ua.y ?? 0) - correctPosition.y);
        isCorrect = dx === 0 && dy === 0;
        score = isCorrect ? 1 : 0;
        feedback = {
          structureMatch: isCorrect
            ? "Correct placement."
            : `You placed at (${ua.x}, ${ua.y}). Correct was (${correctPosition.x}, ${correctPosition.y}).`,
        };
      } else if (
        format === "descriptor_match" ||
        format === "elimination" ||
        format === "skeleton_deduction"
      ) {
        const correctId = (payload as { correctStyleTargetId?: string })
          .correctStyleTargetId;
        const selectedId =
          (userAnswer as { selectedStyleTargetId?: string })
            .selectedStyleTargetId ??
          (userAnswer as { remainingStyleTargetId?: string })
            .remainingStyleTargetId;
        if (!correctId) {
          return reply
            .status(400)
            .send({ error: "payload missing correctStyleTargetId" });
        }
        isCorrect = selectedId === correctId;
        score = isCorrect ? 1 : 0;
        const correctName = (payload as { correctName?: string }).correctName;
        feedback = {
          structureMatch: isCorrect
            ? `Correct: ${correctName}.`
            : `Not quite. The answer was ${correctName}.`,
        };
      } else if (format === "map_recall") {
        const styleTargets =
          (
            payload as {
              styleTargets?: {
                styleTargetId: string;
                correctPosition: { x: number; y: number };
              }[];
            }
          ).styleTargets ?? [];
        const placements =
          (
            userAnswer as {
              placements?: { styleTargetId: string; x: number; y: number }[];
            }
          ).placements ?? [];
        const correctByTarget = new Map(
          styleTargets.map((s) => [s.styleTargetId, s.correctPosition]),
        );
        let correctCount = 0;
        for (const p of placements) {
          const correct = correctByTarget.get(p.styleTargetId);
          if (correct && p.x === correct.x && p.y === correct.y) correctCount++;
        }
        const total = styleTargets.length;
        isCorrect = total > 0 && correctCount === total;
        score = total > 0 ? correctCount / total : 0;
        feedback = {
          structureMatch: `${correctCount}/${total} grapes placed correctly.`,
        };
      } else {
        return reply
          .status(400)
          .send({ error: `Unsupported format: ${format}` });
      }

      await db.insert(exerciseInstance).values({
        userId,
        exerciseTemplateId: templateId,
        seed: (payload as { seed?: number }).seed ?? 0,
        payload: payload as object,
        userAnswer: userAnswer as object,
        isCorrect,
        score,
      });

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

      const correctPosition = (
        payload as { correctPosition?: { x: number; y: number } }
      ).correctPosition;
      return reply.send({
        isCorrect,
        score,
        correctPosition: correctPosition ?? null,
        feedback,
      });
    },
  );
}

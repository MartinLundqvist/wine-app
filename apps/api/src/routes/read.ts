import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "@wine-app/db";
import {
  grape,
  region,
  styleTarget,
  styleTargetGrape,
  styleTargetStructure,
  structureDimension,
  aromaTerm,
  styleTargetAromaProfile,
  thermalBand,
  styleTargetContext,
  countryMapConfig,
  regionBoundaryMapping,
} from "@wine-app/db/schema";
import { regionsMapConfigResponseSchema } from "@wine-app/shared";
import { eq, inArray } from "drizzle-orm";

export async function registerReadRoutes(app: FastifyInstance) {
  app.get("/grapes", async (_req: FastifyRequest, reply: FastifyReply) => {
    const rows = await db
      .select()
      .from(grape)
      .orderBy(grape.sortOrder, grape.id);
    const links = await db.select().from(styleTargetGrape);
    const stMap = new Map<string, string[]>();
    for (const l of links) {
      const arr = stMap.get(l.grapeId) ?? [];
      arr.push(l.styleTargetId);
      stMap.set(l.grapeId, arr);
    }
    const result = rows.map((r) => ({
      ...r,
      styleTargetIds: stMap.get(r.id) ?? [],
    }));
    return reply.send(result);
  });

  app.get("/regions", async (_req: FastifyRequest, reply: FastifyReply) => {
    const rows = await db.select().from(region).orderBy(region.country, region.displayName);
    return reply.send(rows);
  });

  app.get("/regions/map-config", async (_req: FastifyRequest, reply: FastifyReply) => {
    const [countries, boundaryRows, regionsRows] = await Promise.all([
      db.select().from(countryMapConfig).orderBy(countryMapConfig.countryName),
      db.select().from(regionBoundaryMapping),
      db.select().from(region),
    ]);
    const boundaryMappings: Record<string, string[]> = {};
    for (const row of boundaryRows) {
      const list = boundaryMappings[row.regionId] ?? [];
      list.push(row.featureName);
      boundaryMappings[row.regionId] = list;
    }
    const regionIds = new Set(regionsRows.map((r) => r.id));
    const mappableCountries = new Set(
      countries.filter((c) => c.isMappable).map((c) => c.countryName)
    );
    for (const c of countries) {
      if (c.isMappable && (c.isoNumeric == null || !c.geoSlug || c.zoomLevel == null)) {
        app.log.warn({ countryName: c.countryName }, "[map-config] Mappable country missing ISO/geoSlug/zoom");
      }
    }
    for (const r of regionsRows) {
      if (r.parentRegionId == null) continue;
      const parent = regionsRows.find((p) => p.id === r.parentRegionId);
      if (parent && mappableCountries.has(parent.country)) {
        const mappings = boundaryMappings[r.id] ?? [];
        if (mappings.length === 0) {
          app.log.warn({ regionId: r.id, country: r.country }, "[map-config] Sub-region under mappable country has no boundary mapping");
        }
      }
    }
    for (const regionId of Object.keys(boundaryMappings)) {
      if (!regionIds.has(regionId)) {
        app.log.warn({ regionId }, "[map-config] Boundary mapping references non-existent region");
      }
    }
    const payload = { countries, boundaryMappings };
    const parsed = regionsMapConfigResponseSchema.parse(payload);
    return reply.send(parsed);
  });

  app.get(
    "/structure-dimensions",
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const rows = await db.select().from(structureDimension).orderBy(structureDimension.id);
      return reply.send(rows);
    }
  );

  app.get("/aroma-terms", async (_req: FastifyRequest, reply: FastifyReply) => {
    const rows = await db.select().from(aromaTerm).orderBy(aromaTerm.source, aromaTerm.displayName);
    return reply.send(rows);
  });

  app.get("/thermal-bands", async (_req: FastifyRequest, reply: FastifyReply) => {
    const rows = await db.select().from(thermalBand).orderBy(thermalBand.id);
    return reply.send(rows);
  });

  async function buildStyleTargetFull(st: (typeof styleTarget.$inferSelect)[]) {
    const ids = st.map((t) => t.id);
    if (ids.length === 0) return [];

    const [grapesLinks, structureRows, aromaRows, contextRows, regionsRows, thermalRows] =
      await Promise.all([
        db.select().from(styleTargetGrape).where(inArray(styleTargetGrape.styleTargetId, ids)),
        db.select().from(styleTargetStructure).where(inArray(styleTargetStructure.styleTargetId, ids)),
        db.select().from(styleTargetAromaProfile).where(inArray(styleTargetAromaProfile.styleTargetId, ids)),
        db.select().from(styleTargetContext).where(inArray(styleTargetContext.styleTargetId, ids)),
        db.select().from(region),
        db.select().from(thermalBand),
      ]);
    const regionMap = new Map(regionsRows.map((r) => [r.id, r]));
    const thermalMap = new Map(thermalRows.map((t) => [t.id, t]));

    const dimIds = [...new Set(structureRows.map((r) => r.structureDimensionId))];
    const aromaIds = [...new Set(aromaRows.map((r) => r.aromaTermId))];
    const grapeIds = [...new Set(grapesLinks.map((r) => r.grapeId))];

    const [dimensions, aromas, grapes] = await Promise.all([
      dimIds.length > 0
        ? db.select().from(structureDimension).where(inArray(structureDimension.id, dimIds))
        : Promise.resolve([]),
      aromaIds.length > 0
        ? db.select().from(aromaTerm).where(inArray(aromaTerm.id, aromaIds))
        : Promise.resolve([]),
      grapeIds.length > 0
        ? db.select().from(grape).where(inArray(grape.id, grapeIds))
        : Promise.resolve([]),
    ]);
    const dimensionMap = new Map(dimensions.map((d) => [d.id, d]));
    const aromaMap = new Map(aromas.map((a) => [a.id, a]));
    const grapeMap = new Map(grapes.map((g) => [g.id, g]));

    return st.map((t) => {
      const grapes = grapesLinks
        .filter((l) => l.styleTargetId === t.id)
        .map((l) => ({
          grape: grapeMap.get(l.grapeId)!,
          percentage: l.percentage,
          role: l.role,
        }))
        .filter((x) => x.grape);
      const structure = structureRows
        .filter((r) => r.styleTargetId === t.id)
        .map((r) => ({
          ...r,
          dimension: dimensionMap.get(r.structureDimensionId),
        }));
      const aromas = aromaRows
        .filter((r) => r.styleTargetId === t.id)
        .map((r) => ({
          ...r,
          term: aromaMap.get(r.aromaTermId),
        }))
        .filter((x) => x.term);
      const context = contextRows.find((c) => c.styleTargetId === t.id) ?? null;
      const ctxWithThermal = context
        ? {
            ...context,
            thermalBand: context.thermalBandId
              ? thermalMap.get(context.thermalBandId) ?? null
              : null,
          }
        : null;
      return {
        ...t,
        region: t.regionId ? regionMap.get(t.regionId) ?? null : null,
        grapes,
        structure,
        aromas,
        context: ctxWithThermal,
      };
    });
  }

  app.get("/style-targets", async (_req: FastifyRequest, reply: FastifyReply) => {
    const targets = await db
      .select()
      .from(styleTarget)
      .orderBy(styleTarget.ladderTier, styleTarget.displayName);
    const result = await buildStyleTargetFull(targets);
    return reply.send(result);
  });

  app.get(
    "/style-targets/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = req.params;
      const [target] = await db
        .select()
        .from(styleTarget)
        .where(eq(styleTarget.id, id));
      if (!target) return reply.status(404).send({ error: "Style target not found" });
      const [full] = await buildStyleTargetFull([target]);
      return reply.send(full);
    }
  );
}

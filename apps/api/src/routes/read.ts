import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "@wine-app/db";
import {
  grapeVariety,
  region,
  wineStyle,
  wineStyleGrape,
  wineStyleStructure,
  structureDimension,
  appearanceDimension,
  wineStyleAppearance,
  ordinalScale,
  wineStyleAromaCluster,
  wineStyleAromaDescriptor,
  aromaCluster,
  aromaDescriptor,
  aromaSource,
  countryMapConfig,
  regionBoundaryMapping,
} from "@wine-app/db/schema";
import { regionsMapConfigResponseSchema } from "@wine-app/shared";
import { eq, inArray } from "drizzle-orm";
import { getConfusionGroup } from "../services/confusion.js";

export async function registerReadRoutes(app: FastifyInstance) {
  app.get("/grapes", async (_req: FastifyRequest, reply: FastifyReply) => {
    const rows = await db
      .select()
      .from(grapeVariety)
      .orderBy(grapeVariety.sortOrder, grapeVariety.id);
    const links = await db.select().from(wineStyleGrape);
    const styleMap = new Map<string, string[]>();
    for (const l of links) {
      const arr = styleMap.get(l.grapeVarietyId) ?? [];
      arr.push(l.wineStyleId);
      styleMap.set(l.grapeVarietyId, arr);
    }
    const result = rows.map((r) => ({
      ...r,
      wineStyleIds: styleMap.get(r.id) ?? [],
    }));
    return reply.send(result);
  });

  app.get("/regions", async (_req: FastifyRequest, reply: FastifyReply) => {
    const rows = await db
      .select()
      .from(region)
      .orderBy(region.regionLevel, region.displayName);
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
    const mappableCountryNames = new Set(
      countries.filter((c) => c.isMappable).map((c) => c.countryName)
    );
    for (const c of countries) {
      if (
        c.isMappable &&
        (c.isoNumeric == null || !c.geoSlug || c.zoomLevel == null)
      ) {
        app.log.warn(
          { countryName: c.countryName },
          "[map-config] Mappable country missing ISO/geoSlug/zoom"
        );
      }
    }
    for (const r of regionsRows) {
      if (r.parentId == null) continue;
      const parent = regionsRows.find((p) => p.id === r.parentId);
      if (parent && mappableCountryNames.has(parent.displayName)) {
        const mappings = boundaryMappings[r.id] ?? [];
        if (mappings.length === 0) {
          app.log.warn(
            { regionId: r.id, parentName: parent.displayName },
            "[map-config] Sub-region under mappable country has no boundary mapping"
          );
        }
      }
    }
    for (const regionId of Object.keys(boundaryMappings)) {
      if (!regionIds.has(regionId)) {
        app.log.warn(
          { regionId },
          "[map-config] Boundary mapping references non-existent region"
        );
      }
    }
    const payload = { countries, boundaryMappings };
    const parsed = regionsMapConfigResponseSchema.parse(payload);
    return reply.send(parsed);
  });

  app.get("/ordinal-scales", async (_req: FastifyRequest, reply: FastifyReply) => {
    const rows = await db
      .select()
      .from(ordinalScale)
      .orderBy(ordinalScale.id);
    return reply.send(rows);
  });

  app.get(
    "/structure-dimensions",
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const rows = await db
        .select()
        .from(structureDimension)
        .orderBy(structureDimension.id);
      const scaleIds = [...new Set(rows.map((r) => r.ordinalScaleId))];
      const scales =
        scaleIds.length > 0
          ? await db
              .select()
              .from(ordinalScale)
              .where(inArray(ordinalScale.id, scaleIds))
          : [];
      const scaleMap = new Map(scales.map((s) => [s.id, s]));
      const result = rows.map((r) => ({
        ...r,
        ordinalScale: scaleMap.get(r.ordinalScaleId) ?? null,
      }));
      return reply.send(result);
    }
  );

  app.get(
    "/appearance-dimensions",
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const rows = await db
        .select()
        .from(appearanceDimension)
        .orderBy(appearanceDimension.id);
      const scaleIds = [...new Set(rows.map((r) => r.ordinalScaleId))];
      const scales =
        scaleIds.length > 0
          ? await db
              .select()
              .from(ordinalScale)
              .where(inArray(ordinalScale.id, scaleIds))
          : [];
      const scaleMap = new Map(scales.map((s) => [s.id, s]));
      const result = rows.map((r) => ({
        ...r,
        ordinalScale: scaleMap.get(r.ordinalScaleId) ?? null,
      }));
      return reply.send(result);
    }
  );

  app.get("/aroma-taxonomy", async (_req: FastifyRequest, reply: FastifyReply) => {
    const [sources, clusters, descriptors] = await Promise.all([
      db.select().from(aromaSource).orderBy(aromaSource.id),
      db.select().from(aromaCluster).orderBy(aromaCluster.aromaSourceId, aromaCluster.displayName),
      db.select().from(aromaDescriptor).orderBy(aromaDescriptor.aromaClusterId, aromaDescriptor.displayName),
    ]);
    const clusterMap = new Map<string, (typeof descriptors)[0][]>();
    for (const d of descriptors) {
      const list = clusterMap.get(d.aromaClusterId) ?? [];
      list.push(d);
      clusterMap.set(d.aromaClusterId, list);
    }
    const result = sources.map((s) => ({
      ...s,
      clusters: clusters
        .filter((c) => c.aromaSourceId === s.id)
        .map((c) => ({ ...c, descriptors: clusterMap.get(c.id) ?? [] })),
    }));
    return reply.send(result);
  });

  async function buildWineStyleFull(
    styles: (typeof wineStyle.$inferSelect)[]
  ) {
    const ids = styles.map((s) => s.id);
    if (ids.length === 0) return [];

    const [
      grapeLinks,
      structureRows,
      appearanceRows,
      clusterRows,
      descriptorRows,
      regionsRows,
      scaleRows,
    ] = await Promise.all([
      db.select().from(wineStyleGrape).where(inArray(wineStyleGrape.wineStyleId, ids)),
      db.select().from(wineStyleStructure).where(inArray(wineStyleStructure.wineStyleId, ids)),
      db.select().from(wineStyleAppearance).where(inArray(wineStyleAppearance.wineStyleId, ids)),
      db.select().from(wineStyleAromaCluster).where(inArray(wineStyleAromaCluster.wineStyleId, ids)),
      db.select().from(wineStyleAromaDescriptor).where(inArray(wineStyleAromaDescriptor.wineStyleId, ids)),
      db.select().from(region),
      db.select().from(ordinalScale),
    ]);

    const regionMap = new Map(regionsRows.map((r) => [r.id, r]));
    const scaleMap = new Map(scaleRows.map((s) => [s.id, s]));

    const dimIds = [...new Set(structureRows.map((r) => r.structureDimensionId))];
    const appearanceDimIds = [...new Set(appearanceRows.map((r) => r.appearanceDimensionId))];
    const grapeIds = [...new Set(grapeLinks.map((l) => l.grapeVarietyId))];
    const clusterIds = [...new Set(clusterRows.map((r) => r.aromaClusterId))];
    const descriptorIds = [...new Set(descriptorRows.map((r) => r.aromaDescriptorId))];

    const [dimensions, appearanceDimensions, grapes, clusters, descriptors] = await Promise.all([
      dimIds.length > 0
        ? db
            .select()
            .from(structureDimension)
            .where(inArray(structureDimension.id, dimIds))
        : Promise.resolve([]),
      appearanceDimIds.length > 0
        ? db
            .select()
            .from(appearanceDimension)
            .where(inArray(appearanceDimension.id, appearanceDimIds))
        : Promise.resolve([]),
      grapeIds.length > 0
        ? db
            .select()
            .from(grapeVariety)
            .where(inArray(grapeVariety.id, grapeIds))
        : Promise.resolve([]),
      clusterIds.length > 0
        ? db
            .select()
            .from(aromaCluster)
            .where(inArray(aromaCluster.id, clusterIds))
        : Promise.resolve([]),
      descriptorIds.length > 0
        ? db
            .select()
            .from(aromaDescriptor)
            .where(inArray(aromaDescriptor.id, descriptorIds))
        : Promise.resolve([]),
    ]);

    const dimensionMap = new Map(dimensions.map((d) => [d.id, d]));
    const appearanceDimensionMap = new Map(appearanceDimensions.map((d) => [d.id, d]));
    const grapeMap = new Map(grapes.map((g) => [g.id, g]));
    const clusterMap = new Map(clusters.map((c) => [c.id, c]));
    const descriptorMap = new Map(descriptors.map((d) => [d.id, d]));

    return styles.map((s) => {
      const regionRow = s.regionId ? regionMap.get(s.regionId) ?? null : null;
      const climateScale = s.climateOrdinalScaleId
        ? scaleMap.get(s.climateOrdinalScaleId) ?? null
        : null;
      const grapesList = grapeLinks
        .filter((l) => l.wineStyleId === s.id)
        .map((l) => ({
          grape: grapeMap.get(l.grapeVarietyId)!,
          percentage: l.percentage,
        }))
        .filter((x) => x.grape);
      const structureList = structureRows
        .filter((r) => r.wineStyleId === s.id)
        .map((r) => {
          const dim = dimensionMap.get(r.structureDimensionId);
          const scale = dim ? scaleMap.get(dim.ordinalScaleId) ?? null : null;
          return {
            ...r,
            dimension: dim
              ? { ...dim, ordinalScale: scale ?? undefined }
              : undefined,
          };
        });
      const appearanceList = appearanceRows
        .filter((r) => r.wineStyleId === s.id)
        .map((r) => {
          const dim = appearanceDimensionMap.get(r.appearanceDimensionId);
          const scale = dim ? scaleMap.get(dim.ordinalScaleId) ?? null : null;
          return {
            ...r,
            dimension: dim
              ? { ...dim, ordinalScale: scale ?? undefined }
              : undefined,
          };
        });
      const aromaClustersList = clusterRows
        .filter((r) => r.wineStyleId === s.id)
        .map((r) => ({
          ...r,
          cluster: clusterMap.get(r.aromaClusterId),
        }))
        .filter((x) => x.cluster);
      const aromaDescriptorsList = descriptorRows
        .filter((r) => r.wineStyleId === s.id)
        .map((r) => {
          const descriptor = descriptorMap.get(r.aromaDescriptorId);
          const cluster = descriptor
            ? clusterMap.get(descriptor.aromaClusterId)
            : undefined;
          return {
            ...r,
            descriptor,
            cluster,
          };
        })
        .filter((x) => x.descriptor);

      return {
        ...s,
        region: regionRow,
        climateOrdinalScale: climateScale,
        grapes: grapesList,
        structure: structureList,
        appearance: appearanceList,
        aromaClusters: aromaClustersList,
        aromaDescriptors: aromaDescriptorsList,
      };
    });
  }

  app.get("/style-targets", async (_req: FastifyRequest, reply: FastifyReply) => {
    const styles = await db
      .select()
      .from(wineStyle)
      .orderBy(wineStyle.displayName);
    const result = await buildWineStyleFull(styles);
    return reply.send(result);
  });

  app.get(
    "/style-targets/:id",
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = req.params;
      const [style] = await db
        .select()
        .from(wineStyle)
        .where(eq(wineStyle.id, id));
      if (!style)
        return reply.status(404).send({ error: "Style target not found" });
      const [full] = await buildWineStyleFull([style]);
      return reply.send(full);
    }
  );

  app.get(
    "/style-targets/:id/confusion-group",
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Querystring: { difficulty?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = req.params;
      const rawDifficulty = req.query.difficulty ?? "medium";
      const difficulty =
        rawDifficulty === "easy" || rawDifficulty === "medium" || rawDifficulty === "hard"
          ? rawDifficulty
          : null;
      if (!difficulty) {
        return reply.status(400).send({
          error: "Invalid difficulty",
          message:
            "Query param 'difficulty' must be one of: easy, medium, hard",
        });
      }
      const [style] = await db
        .select()
        .from(wineStyle)
        .where(eq(wineStyle.id, id));
      if (!style) {
        return reply.status(404).send({ error: "Style target not found" });
      }
      const styles = await db
        .select()
        .from(wineStyle)
        .orderBy(wineStyle.displayName);
      const fullStyles = await buildWineStyleFull(styles);
      const allClusters = await db.select().from(aromaCluster);
      const allDescriptors = await db.select().from(aromaDescriptor);
      const result = getConfusionGroup(
        fullStyles,
        allClusters,
        allDescriptors,
        id,
        difficulty
      );
      return reply.send(result);
    }
  );
}

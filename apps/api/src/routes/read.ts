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
import {
  regionsMapConfigResponseSchema,
  regionCreateSchema,
  regionLevelSchema,
  countryMapConfigUpsertSchema,
  boundaryMappingsUpsertSchema,
} from "@wine-app/shared";
import { eq, inArray } from "drizzle-orm";
import { requireAdmin } from "../auth/preHandler.js";
import { getConfusionGroup } from "../services/confusion.js";
import { buildWineStyleFull } from "../services/wineStyles.js";
import { getCountryTopoJson, getCountryFeatureNames, getCountryGeoSuggestions } from "../services/geo.js";

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

  app.post<{ Body: unknown }>(
    "/regions",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const parsed = regionCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const input = parsed.data;
      if (input.parentId != null) {
        const [parentRow] = await db
          .select({ id: region.id })
          .from(region)
          .where(eq(region.id, input.parentId))
          .limit(1);
        if (!parentRow) {
          return reply.status(400).send({ error: "Bad request", message: "parentId not found" });
        }
      }
      try {
        const [inserted] = await db
          .insert(region)
          .values({
            id: input.id,
            displayName: input.displayName,
            regionLevel: input.regionLevel,
            parentId: input.parentId ?? null,
            notes: input.notes ?? null,
          })
          .returning();
        if (!inserted) return reply.status(500).send({ error: "Insert failed" });
        return reply.status(201).send(inserted);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Create failed";
        if (message.includes("duplicate") || message.includes("unique")) {
          return reply.status(400).send({ error: "Bad request", message: "Region id already exists" });
        }
        req.log?.error?.(err, "Region create failed");
        throw err;
      }
    }
  );

  app.put<{ Params: { id: string }; Body: unknown }>(
    "/regions/:id",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const { id } = req.params;
      const [existing] = await db.select().from(region).where(eq(region.id, id)).limit(1);
      if (!existing) return reply.status(404).send({ error: "Not found" });

      const bodySchema = regionCreateSchema.partial().omit({ id: true });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const input = parsed.data;

      if (input.regionLevel !== undefined) {
        const check = regionLevelSchema.safeParse(input.regionLevel);
        if (!check.success) return reply.status(400).send({ error: "Invalid regionLevel" });
      }

      if (input.parentId !== undefined && input.parentId !== null) {
        if (input.parentId === id) {
          return reply.status(400).send({ error: "Bad request", message: "A region cannot be its own parent" });
        }
        const [parentRow] = await db.select({ id: region.id }).from(region).where(eq(region.id, input.parentId)).limit(1);
        if (!parentRow) return reply.status(400).send({ error: "Bad request", message: "parentId not found" });
      }

      const updates: Partial<typeof existing> = {};
      if (input.displayName !== undefined) updates.displayName = input.displayName;
      if (input.regionLevel !== undefined) updates.regionLevel = input.regionLevel;
      if (input.parentId !== undefined) updates.parentId = input.parentId ?? null;
      if (input.notes !== undefined) updates.notes = input.notes ?? null;

      if (Object.keys(updates).length === 0) {
        return reply.send(existing);
      }

      const [updated] = await db.update(region).set(updates).where(eq(region.id, id)).returning();
      return reply.send(updated);
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/regions/:id",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const { id } = req.params;
      const [existing] = await db.select().from(region).where(eq(region.id, id)).limit(1);
      if (!existing) return reply.status(404).send({ error: "Not found" });

      const [child] = await db.select({ id: region.id }).from(region).where(eq(region.parentId, id)).limit(1);
      if (child) {
        return reply.status(400).send({ error: "Bad request", message: "Cannot delete a region that has child regions" });
      }

      const [usedByStyle] = await db.select({ id: wineStyle.id }).from(wineStyle).where(eq(wineStyle.regionId, id)).limit(1);
      if (usedByStyle) {
        return reply.status(400).send({ error: "Bad request", message: "Cannot delete a region that is referenced by wine styles" });
      }

      await db.delete(region).where(eq(region.id, id));
      return reply.status(204).send();
    }
  );

  app.get("/regions/map-config", async (_req: FastifyRequest, reply: FastifyReply) => {
    const [countries, boundaryRows, regionsRows] = await Promise.all([
      db
        .select({
          regionId: countryMapConfig.regionId,
          countryName: region.displayName,
          isoNumeric: countryMapConfig.isoNumeric,
          geoSlug: countryMapConfig.geoSlug,
          naturalEarthAdminName: countryMapConfig.naturalEarthAdminName,
          zoomCenterLon: countryMapConfig.zoomCenterLon,
          zoomCenterLat: countryMapConfig.zoomCenterLat,
          zoomLevel: countryMapConfig.zoomLevel,
          isMappable: countryMapConfig.isMappable,
        })
        .from(countryMapConfig)
        .innerJoin(region, eq(countryMapConfig.regionId, region.id))
        .orderBy(region.displayName),
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
    const mappableRegionIds = new Set(
      countries.filter((c) => c.isMappable).map((c) => c.regionId)
    );
    for (const c of countries) {
      if (
        c.isMappable &&
        (c.isoNumeric == null || !c.geoSlug || c.zoomLevel == null)
      ) {
        app.log.warn(
          { regionId: c.regionId },
          "[map-config] Mappable country missing ISO/geoSlug/zoom"
        );
      }
    }
    for (const r of regionsRows) {
      if (r.parentId == null) continue;
      if (mappableRegionIds.has(r.parentId)) {
        const mappings = boundaryMappings[r.id] ?? [];
        if (mappings.length === 0) {
          app.log.warn(
            { regionId: r.id, parentId: r.parentId },
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

  app.get(
    "/regions/geo/suggestions",
    async (req: FastifyRequest<{ Querystring: { adminName?: string } }>, reply: FastifyReply) => {
      const { adminName } = req.query;
      if (!adminName?.trim()) {
        return reply.status(400).send({ error: "Bad request", message: "adminName query param is required" });
      }
      const suggestions = getCountryGeoSuggestions(adminName.trim());
      return reply.send({ suggestions });
    }
  );

  app.get(
    "/regions/geo/:geoSlug",
    async (req: FastifyRequest<{ Params: { geoSlug: string } }>, reply: FastifyReply) => {
      const { geoSlug } = req.params;
      const [config] = await db
        .select({ naturalEarthAdminName: countryMapConfig.naturalEarthAdminName })
        .from(countryMapConfig)
        .where(eq(countryMapConfig.geoSlug, geoSlug))
        .limit(1);
      if (!config) {
        return reply.status(404).send({ error: "Not found", message: `No map config for slug "${geoSlug}"` });
      }
      const topo = getCountryTopoJson(config.naturalEarthAdminName);
      if (!topo) {
        return reply.status(404).send({ error: "Not found", message: `No geo features for "${config.naturalEarthAdminName}"` });
      }
      return reply.send(topo);
    }
  );

  app.get(
    "/regions/geo/:geoSlug/features",
    async (req: FastifyRequest<{ Params: { geoSlug: string } }>, reply: FastifyReply) => {
      const { geoSlug } = req.params;
      const [config] = await db
        .select({ naturalEarthAdminName: countryMapConfig.naturalEarthAdminName })
        .from(countryMapConfig)
        .where(eq(countryMapConfig.geoSlug, geoSlug))
        .limit(1);
      if (!config) {
        return reply.status(404).send({ error: "Not found", message: `No map config for slug "${geoSlug}"` });
      }
      const featureNames = getCountryFeatureNames(config.naturalEarthAdminName);
      const suggestions = getCountryGeoSuggestions(config.naturalEarthAdminName);
      return reply.send({ featureNames, suggestions });
    }
  );

  app.put<{ Params: { id: string }; Body: unknown }>(
    "/regions/:id/map-config",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const { id } = req.params;
      const [existing] = await db
        .select({ id: region.id, regionLevel: region.regionLevel })
        .from(region)
        .where(eq(region.id, id))
        .limit(1);
      if (!existing) return reply.status(404).send({ error: "Not found" });
      if (existing.regionLevel !== "country") {
        return reply.status(400).send({ error: "Bad request", message: "Map config is only allowed for country-level regions" });
      }
      const parsed = countryMapConfigUpsertSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const input = parsed.data;
      const [saved] = await db
        .insert(countryMapConfig)
        .values({ regionId: id, ...input, isMappable: input.isMappable ?? false })
        .onConflictDoUpdate({
          target: countryMapConfig.regionId,
          set: {
            isoNumeric: input.isoNumeric,
            geoSlug: input.geoSlug,
            naturalEarthAdminName: input.naturalEarthAdminName,
            zoomCenterLon: input.zoomCenterLon,
            zoomCenterLat: input.zoomCenterLat,
            zoomLevel: input.zoomLevel,
            isMappable: input.isMappable ?? false,
          },
        })
        .returning();
      return reply.send(saved);
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/regions/:id/map-config",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const { id } = req.params;
      await db.delete(countryMapConfig).where(eq(countryMapConfig.regionId, id));
      return reply.status(204).send();
    }
  );

  app.get<{ Params: { id: string } }>(
    "/regions/:id/boundary-mappings",
    async (req, reply) => {
      const { id } = req.params;
      const rows = await db
        .select({ featureName: regionBoundaryMapping.featureName })
        .from(regionBoundaryMapping)
        .where(eq(regionBoundaryMapping.regionId, id));
      return reply.send({ featureNames: rows.map((r) => r.featureName).sort() });
    }
  );

  app.put<{ Params: { id: string }; Body: unknown }>(
    "/regions/:id/boundary-mappings",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const { id } = req.params;
      const [existing] = await db
        .select({ id: region.id })
        .from(region)
        .where(eq(region.id, id))
        .limit(1);
      if (!existing) return reply.status(404).send({ error: "Not found" });
      const parsed = boundaryMappingsUpsertSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const { featureNames } = parsed.data;
      await db.delete(regionBoundaryMapping).where(eq(regionBoundaryMapping.regionId, id));
      if (featureNames.length > 0) {
        await db.insert(regionBoundaryMapping).values(
          featureNames.map((name) => ({ regionId: id, featureName: name }))
        );
      }
      return reply.send({ featureNames: [...featureNames].sort() });
    }
  );

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

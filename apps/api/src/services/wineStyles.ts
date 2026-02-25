import { db } from "@wine-app/db";
import {
  wineStyle,
  wineStyleGrape,
  wineStyleStructure,
  wineStyleAppearance,
  wineStyleAromaCluster,
  wineStyleAromaDescriptor,
  region,
  ordinalScale,
  grapeVariety,
  structureDimension,
  appearanceDimension,
  aromaCluster,
  aromaDescriptor,
} from "@wine-app/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { WineStyleCreate, WineStylePatch } from "@wine-app/shared";

type WineStyleRow = (typeof wineStyle.$inferSelect)[][number];

export async function buildWineStyleFull(styles: WineStyleRow[]) {
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
      ? db.select().from(grapeVariety).where(inArray(grapeVariety.id, grapeIds))
      : Promise.resolve([]),
    clusterIds.length > 0
      ? db.select().from(aromaCluster).where(inArray(aromaCluster.id, clusterIds))
      : Promise.resolve([]),
    descriptorIds.length > 0
      ? db.select().from(aromaDescriptor).where(inArray(aromaDescriptor.id, descriptorIds))
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

async function validateRegionId(regionId: string | null): Promise<void> {
  if (!regionId) return;
  const [r] = await db.select().from(region).where(eq(region.id, regionId)).limit(1);
  if (!r) throw new Error(`regionId ${regionId} not found`);
}

async function validateOrdinalScaleId(scaleId: string | null): Promise<void> {
  if (!scaleId) return;
  const [s] = await db.select().from(ordinalScale).where(eq(ordinalScale.id, scaleId)).limit(1);
  if (!s) throw new Error(`climateOrdinalScaleId ${scaleId} not found`);
}

async function validateGrapeIds(grapeIds: string[]): Promise<void> {
  if (grapeIds.length === 0) return;
  const rows = await db.select({ id: grapeVariety.id }).from(grapeVariety).where(inArray(grapeVariety.id, grapeIds));
  const found = new Set(rows.map((r) => r.id));
  const missing = grapeIds.filter((id) => !found.has(id));
  if (missing.length > 0) throw new Error(`grapeVarietyIds not found: ${missing.join(", ")}`);
}

async function validateStructureDimensionIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const rows = await db.select({ id: structureDimension.id }).from(structureDimension).where(inArray(structureDimension.id, ids));
  const found = new Set(rows.map((r) => r.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length > 0) throw new Error(`structureDimensionIds not found: ${missing.join(", ")}`);
}

async function validateAppearanceDimensionIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const rows = await db.select({ id: appearanceDimension.id }).from(appearanceDimension).where(inArray(appearanceDimension.id, ids));
  const found = new Set(rows.map((r) => r.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length > 0) throw new Error(`appearanceDimensionIds not found: ${missing.join(", ")}`);
}

async function validateAromaClusterIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const rows = await db.select({ id: aromaCluster.id }).from(aromaCluster).where(inArray(aromaCluster.id, ids));
  const found = new Set(rows.map((r) => r.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length > 0) throw new Error(`aromaClusterIds not found: ${missing.join(", ")}`);
}

async function validateAromaDescriptorIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const rows = await db.select({ id: aromaDescriptor.id }).from(aromaDescriptor).where(inArray(aromaDescriptor.id, ids));
  const found = new Set(rows.map((r) => r.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length > 0) throw new Error(`aromaDescriptorIds not found: ${missing.join(", ")}`);
}

export async function createWineStyle(input: WineStyleCreate) {
  await validateRegionId(input.regionId ?? null);
  await validateOrdinalScaleId(input.climateOrdinalScaleId ?? null);
  if (input.grapes?.length) await validateGrapeIds(input.grapes.map((g) => g.grapeVarietyId));
  if (input.structure?.length) await validateStructureDimensionIds(input.structure.map((s) => s.structureDimensionId));
  if (input.appearance?.length) await validateAppearanceDimensionIds(input.appearance.map((a) => a.appearanceDimensionId));
  if (input.aromaClusters?.length) await validateAromaClusterIds(input.aromaClusters.map((c) => c.aromaClusterId));
  if (input.aromaDescriptors?.length) await validateAromaDescriptorIds(input.aromaDescriptors.map((d) => d.aromaDescriptorId));

  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(wineStyle)
      .values({
        id: input.id,
        displayName: input.displayName,
        styleType: input.styleType,
        producedColor: input.producedColor,
        wineCategory: input.wineCategory ?? "still",
        regionId: input.regionId ?? null,
        climateMin: input.climateMin ?? null,
        climateMax: input.climateMax ?? null,
        climateOrdinalScaleId: input.climateOrdinalScaleId ?? null,
        notes: input.notes ?? null,
      })
      .returning();
    if (!inserted) throw new Error("Insert failed");

    if (input.grapes?.length) {
      await tx.insert(wineStyleGrape).values(
        input.grapes.map((g) => ({
          wineStyleId: input.id,
          grapeVarietyId: g.grapeVarietyId,
          percentage: g.percentage ?? null,
        }))
      );
    }
    if (input.structure?.length) {
      await tx.insert(wineStyleStructure).values(
        input.structure.map((s) => ({
          wineStyleId: input.id,
          structureDimensionId: s.structureDimensionId,
          minValue: s.minValue,
          maxValue: s.maxValue,
        }))
      );
    }
    if (input.appearance?.length) {
      await tx.insert(wineStyleAppearance).values(
        input.appearance.map((a) => ({
          wineStyleId: input.id,
          appearanceDimensionId: a.appearanceDimensionId,
          minValue: a.minValue,
          maxValue: a.maxValue,
        }))
      );
    }
    if (input.aromaClusters?.length) {
      await tx.insert(wineStyleAromaCluster).values(
        input.aromaClusters.map((c) => ({
          wineStyleId: input.id,
          aromaClusterId: c.aromaClusterId,
          intensityMin: c.intensityMin,
          intensityMax: c.intensityMax,
        }))
      );
    }
    if (input.aromaDescriptors?.length) {
      await tx.insert(wineStyleAromaDescriptor).values(
        input.aromaDescriptors.map((d) => ({
          wineStyleId: input.id,
          aromaDescriptorId: d.aromaDescriptorId,
          salience: d.salience,
        }))
      );
    }
    return inserted;
  }).then(async (inserted) => {
    const [full] = await buildWineStyleFull([inserted]);
    if (!full) throw new Error("Build full style failed");
    return full;
  });
}

export async function patchWineStyle(id: string, patch: WineStylePatch) {
  const [existing] = await db.select().from(wineStyle).where(eq(wineStyle.id, id)).limit(1);
  if (!existing) return null;

  if (patch.regionId !== undefined) await validateRegionId(patch.regionId);
  if (patch.climateOrdinalScaleId !== undefined) await validateOrdinalScaleId(patch.climateOrdinalScaleId);
  if (patch.grapes?.length) await validateGrapeIds(patch.grapes.map((g) => g.grapeVarietyId));
  if (patch.structure?.length) await validateStructureDimensionIds(patch.structure.map((s) => s.structureDimensionId));
  if (patch.appearance?.length) await validateAppearanceDimensionIds(patch.appearance.map((a) => a.appearanceDimensionId));
  if (patch.aromaClusters?.length) await validateAromaClusterIds(patch.aromaClusters.map((c) => c.aromaClusterId));
  if (patch.aromaDescriptors?.length) await validateAromaDescriptorIds(patch.aromaDescriptors.map((d) => d.aromaDescriptorId));

  return db.transaction(async (tx) => {
    const core: Partial<typeof wineStyle.$inferInsert> = {};
    if (patch.displayName !== undefined) core.displayName = patch.displayName;
    if (patch.styleType !== undefined) core.styleType = patch.styleType;
    if (patch.producedColor !== undefined) core.producedColor = patch.producedColor;
    if (patch.wineCategory !== undefined) core.wineCategory = patch.wineCategory;
    if (patch.regionId !== undefined) core.regionId = patch.regionId;
    if (patch.climateMin !== undefined) core.climateMin = patch.climateMin;
    if (patch.climateMax !== undefined) core.climateMax = patch.climateMax;
    if (patch.climateOrdinalScaleId !== undefined) core.climateOrdinalScaleId = patch.climateOrdinalScaleId;
    if (patch.notes !== undefined) core.notes = patch.notes;
    if (Object.keys(core).length > 0) {
      await tx.update(wineStyle).set(core).where(eq(wineStyle.id, id));
    }

    if (patch.grapes !== undefined) {
      await tx.delete(wineStyleGrape).where(eq(wineStyleGrape.wineStyleId, id));
      if (patch.grapes.length > 0) {
        await tx.insert(wineStyleGrape).values(
          patch.grapes.map((g) => ({
            wineStyleId: id,
            grapeVarietyId: g.grapeVarietyId,
            percentage: g.percentage ?? null,
          }))
        );
      }
    }
    if (patch.structure !== undefined) {
      await tx.delete(wineStyleStructure).where(eq(wineStyleStructure.wineStyleId, id));
      if (patch.structure.length > 0) {
        await tx.insert(wineStyleStructure).values(
          patch.structure.map((s) => ({
            wineStyleId: id,
            structureDimensionId: s.structureDimensionId,
            minValue: s.minValue,
            maxValue: s.maxValue,
          }))
        );
      }
    }
    if (patch.appearance !== undefined) {
      await tx.delete(wineStyleAppearance).where(eq(wineStyleAppearance.wineStyleId, id));
      if (patch.appearance.length > 0) {
        await tx.insert(wineStyleAppearance).values(
          patch.appearance.map((a) => ({
            wineStyleId: id,
            appearanceDimensionId: a.appearanceDimensionId,
            minValue: a.minValue,
            maxValue: a.maxValue,
          }))
        );
      }
    }
    if (patch.aromaClusters !== undefined) {
      await tx.delete(wineStyleAromaCluster).where(eq(wineStyleAromaCluster.wineStyleId, id));
      if (patch.aromaClusters.length > 0) {
        await tx.insert(wineStyleAromaCluster).values(
          patch.aromaClusters.map((c) => ({
            wineStyleId: id,
            aromaClusterId: c.aromaClusterId,
            intensityMin: c.intensityMin,
            intensityMax: c.intensityMax,
          }))
        );
      }
    }
    if (patch.aromaDescriptors !== undefined) {
      await tx.delete(wineStyleAromaDescriptor).where(eq(wineStyleAromaDescriptor.wineStyleId, id));
      if (patch.aromaDescriptors.length > 0) {
        await tx.insert(wineStyleAromaDescriptor).values(
          patch.aromaDescriptors.map((d) => ({
            wineStyleId: id,
            aromaDescriptorId: d.aromaDescriptorId,
            salience: d.salience,
          }))
        );
      }
    }

    const [updated] = await tx.select().from(wineStyle).where(eq(wineStyle.id, id)).limit(1);
    return updated ?? null;
  }).then(async (updated) => {
    if (!updated) return null;
    const [full] = await buildWineStyleFull([updated]);
    return full!;
  });
}

export async function deleteWineStyle(id: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const deleted = await tx.delete(wineStyle).where(eq(wineStyle.id, id)).returning({ id: wineStyle.id });
    return deleted.length > 0;
  });
}

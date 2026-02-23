import { z } from "zod";

// Enums (v2 wine knowledge engine)
export const grapeColorSchema = z.enum(["red", "white"]);
export const wineCategorySchema = z.enum(["still", "sparkling", "fortified"]);
export const producedColorSchema = z.enum(["red", "white", "rose"]);
export const styleTypeSchema = z.enum([
  "global_archetype",
  "regional_archetype",
  "appellation_archetype",
  "specific_bottle",
]);
export const regionLevelSchema = z.enum([
  "country",
  "region",
  "sub_region",
  "appellation",
  "vineyard",
]);
export const descriptorSalienceSchema = z.enum([
  "dominant",
  "supporting",
  "occasional",
]);

// Kept for explore / user layer
export const wineColorSchema = z.enum(["red", "white"]);

// Ordinal scale (variable-length labels; structure/climate dimensions use 5-point scales by convention)
export const ordinalScaleSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  labels: z.array(z.string()).min(2),
});
export type OrdinalScale = z.infer<typeof ordinalScaleSchema>;

// Region (single table, self-referencing)
export const regionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  regionLevel: regionLevelSchema,
  parentId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type Region = z.infer<typeof regionSchema>;

// Grape variety
export const grapeSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  color: grapeColorSchema,
  sortOrder: z.number(),
  notes: z.string().nullable().optional(),
});
export type Grape = z.infer<typeof grapeSchema>;

// Wine style (core entity)
export const wineStyleSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  styleType: styleTypeSchema,
  producedColor: producedColorSchema,
  wineCategory: wineCategorySchema,
  regionId: z.string().nullable().optional(),
  climateMin: z.number().nullable().optional(),
  climateMax: z.number().nullable().optional(),
  climateOrdinalScaleId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type WineStyle = z.infer<typeof wineStyleSchema>;

// Structure dimension (references ordinal scale for labels)
export const structureDimensionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  ordinalScaleId: z.string(),
});
export type StructureDimension = z.infer<typeof structureDimensionSchema>;

// Wine style – structure range (min/max 1–5)
export const wineStyleStructureSchema = z.object({
  wineStyleId: z.string(),
  structureDimensionId: z.string(),
  minValue: z.number(),
  maxValue: z.number(),
});
export type WineStyleStructure = z.infer<typeof wineStyleStructureSchema>;

// Appearance dimension (nullable producedColor = applies to all colors)
export const appearanceDimensionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  producedColor: producedColorSchema.nullable().optional(),
  ordinalScaleId: z.string(),
});
export type AppearanceDimension = z.infer<typeof appearanceDimensionSchema>;

// Wine style – appearance range (min/max 1-based; max must be <= dimension scale length)
export const wineStyleAppearanceSchema = z.object({
  wineStyleId: z.string(),
  appearanceDimensionId: z.string(),
  minValue: z.number(),
  maxValue: z.number(),
});
export type WineStyleAppearance = z.infer<typeof wineStyleAppearanceSchema>;

// Aroma taxonomy
export const aromaSourceSchema = z.object({
  id: z.string(),
  displayName: z.string(),
});
export type AromaSource = z.infer<typeof aromaSourceSchema>;

export const aromaClusterSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  aromaSourceId: z.string(),
});
export type AromaCluster = z.infer<typeof aromaClusterSchema>;

export const aromaDescriptorSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  aromaClusterId: z.string(),
});
export type AromaDescriptor = z.infer<typeof aromaDescriptorSchema>;

// Flat aroma term (legacy /aroma-terms response: source + cluster + descriptor with parentId)
export const aromaTermFlatSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  parentId: z.string().nullable(),
  source: z.enum(["primary", "secondary", "tertiary"]),
  description: z.string().nullable().optional(),
});
export type AromaTermFlat = z.infer<typeof aromaTermFlatSchema>;

// Wine style – aroma cluster (intensity range 1–5)
export const wineStyleAromaClusterSchema = z.object({
  wineStyleId: z.string(),
  aromaClusterId: z.string(),
  intensityMin: z.number(),
  intensityMax: z.number(),
});
export type WineStyleAromaCluster = z.infer<typeof wineStyleAromaClusterSchema>;

// Wine style – aroma descriptor (salience)
export const wineStyleAromaDescriptorSchema = z.object({
  wineStyleId: z.string(),
  aromaDescriptorId: z.string(),
  salience: descriptorSalienceSchema,
});
export type WineStyleAromaDescriptor = z.infer<
  typeof wineStyleAromaDescriptorSchema
>;

// Blend row
export const wineStyleGrapeSchema = z.object({
  wineStyleId: z.string(),
  grapeVarietyId: z.string(),
  percentage: z.number().nullable().optional(),
});
export type WineStyleGrape = z.infer<typeof wineStyleGrapeSchema>;

// Map config (unchanged)
export const countryMapConfigSchema = z.object({
  countryName: z.string(),
  isoNumeric: z.number(),
  geoSlug: z.string(),
  naturalEarthAdminName: z.string(),
  zoomCenterLon: z.number(),
  zoomCenterLat: z.number(),
  zoomLevel: z.number(),
  isMappable: z.boolean().optional(),
});
export type CountryMapConfig = z.infer<typeof countryMapConfigSchema>;

export const regionBoundaryMappingSchema = z.object({
  regionId: z.string(),
  featureName: z.string(),
});
export type RegionBoundaryMapping = z.infer<typeof regionBoundaryMappingSchema>;

export const regionsMapConfigResponseSchema = z.object({
  countries: z.array(countryMapConfigSchema),
  boundaryMappings: z.record(z.string(), z.array(z.string())),
});
export type RegionsMapConfigResponse = z.infer<
  typeof regionsMapConfigResponseSchema
>;

// Composite: structure dimension with its scale labels (for API)
export const structureDimensionWithScaleSchema = structureDimensionSchema.extend({
  ordinalScale: ordinalScaleSchema.optional(),
});
export type StructureDimensionWithScale = z.infer<
  typeof structureDimensionWithScaleSchema
>;

export const wineStyleStructureWithDimensionSchema =
  wineStyleStructureSchema.extend({
    dimension: structureDimensionWithScaleSchema.optional(),
  });
export type WineStyleStructureWithDimension = z.infer<
  typeof wineStyleStructureWithDimensionSchema
>;

// Composite: appearance dimension with its scale labels (for API)
export const appearanceDimensionWithScaleSchema =
  appearanceDimensionSchema.extend({
    ordinalScale: ordinalScaleSchema.optional(),
  });
export type AppearanceDimensionWithScale = z.infer<
  typeof appearanceDimensionWithScaleSchema
>;

export const wineStyleAppearanceWithDimensionSchema =
  wineStyleAppearanceSchema.extend({
    dimension: appearanceDimensionWithScaleSchema.optional(),
  });
export type WineStyleAppearanceWithDimension = z.infer<
  typeof wineStyleAppearanceWithDimensionSchema
>;

// Composite: aroma cluster with optional source info
export const wineStyleAromaClusterWithClusterSchema =
  wineStyleAromaClusterSchema.extend({
    cluster: aromaClusterSchema.optional(),
  });
export type WineStyleAromaClusterWithCluster = z.infer<
  typeof wineStyleAromaClusterWithClusterSchema
>;

// Composite: aroma descriptor with optional cluster/source
export const wineStyleAromaDescriptorWithDescriptorSchema =
  wineStyleAromaDescriptorSchema.extend({
    descriptor: aromaDescriptorSchema.optional(),
    cluster: aromaClusterSchema.optional(),
  });
export type WineStyleAromaDescriptorWithDescriptor = z.infer<
  typeof wineStyleAromaDescriptorWithDescriptorSchema
>;

// Full wine style (for API detail and list)
export const wineStyleFullSchema = wineStyleSchema.extend({
  region: regionSchema.nullable().optional(),
  climateOrdinalScale: ordinalScaleSchema.nullable().optional(),
  grapes: z
    .array(
      z.object({
        grape: grapeSchema,
        percentage: z.number().nullable().optional(),
      })
    )
    .optional(),
  structure: z.array(wineStyleStructureWithDimensionSchema).optional(),
  appearance: z.array(wineStyleAppearanceWithDimensionSchema).optional(),
  aromaClusters: z.array(wineStyleAromaClusterWithClusterSchema).optional(),
  aromaDescriptors: z
    .array(wineStyleAromaDescriptorWithDescriptorSchema)
    .optional(),
});
export type WineStyleFull = z.infer<typeof wineStyleFullSchema>;

// Grape with wine style ids (for explore)
export const grapeWithWineStyleIdsSchema = grapeSchema.extend({
  wineStyleIds: z.array(z.string()).optional(),
});
export type GrapeWithWineStyleIds = z.infer<typeof grapeWithWineStyleIdsSchema>;

// Region tree (optional children)
export type RegionWithChildren = z.infer<typeof regionSchema> & {
  children?: RegionWithChildren[];
};
export const regionWithChildrenSchema: z.ZodType<RegionWithChildren> =
  regionSchema.extend({
    children: z.lazy(() => z.array(regionWithChildrenSchema)).optional(),
  });

// Aroma tree: source -> clusters -> descriptors (for explore/UI)
export const aromaDescriptorWithClusterSchema = aromaDescriptorSchema.extend({
  cluster: aromaClusterSchema.optional(),
});
export type AromaDescriptorWithCluster = z.infer<
  typeof aromaDescriptorWithClusterSchema
>;

export const aromaClusterWithDescriptorsSchema = aromaClusterSchema.extend({
  descriptors: z.array(aromaDescriptorSchema).optional(),
});
export type AromaClusterWithDescriptors = z.infer<
  typeof aromaClusterWithDescriptorsSchema
>;

export const aromaSourceWithClustersSchema = aromaSourceSchema.extend({
  clusters: z.array(aromaClusterWithDescriptorsSchema).optional(),
});
export type AromaSourceWithClusters = z.infer<
  typeof aromaSourceWithClustersSchema
>;

// Response schemas
export const grapesResponseSchema = z.array(grapeWithWineStyleIdsSchema);
export const regionsResponseSchema = z.array(regionSchema);
export const ordinalScalesResponseSchema = z.array(ordinalScaleSchema);
export const structureDimensionsResponseSchema = z.array(
  structureDimensionWithScaleSchema
);
export const appearanceDimensionsResponseSchema = z.array(
  appearanceDimensionWithScaleSchema
);
export const aromaTaxonomyResponseSchema = z.array(aromaSourceWithClustersSchema);
export const wineStylesResponseSchema = z.array(wineStyleFullSchema);
export const wineStyleResponseSchema = wineStyleFullSchema;

// Confusion group (similar-style distractors)
export const confusionDifficultySchema = z.enum(["easy", "medium", "hard"]);
export type ConfusionDifficulty = z.infer<typeof confusionDifficultySchema>;

export const confusionAromaSetsSchema = z.object({
  sharedAromas: z.array(z.string()),
  targetUniqueAromas: z.array(z.string()),
  distractorUniqueAromas: z.array(z.string()),
});
export type ConfusionAromaSets = z.infer<typeof confusionAromaSetsSchema>;

export const confusionDistractorRoleSchema = z.enum([
  "evil_twin",
  "structural_match",
  "directional_match",
]);
export type ConfusionDistractorRole = z.infer<
  typeof confusionDistractorRoleSchema
>;

export const confusionDistractorSchema = z.object({
  styleId: z.string(),
  styleName: z.string(),
  role: confusionDistractorRoleSchema,
  similarity: z.number(),
  pivotDimensions: z.array(z.string()),
  aromaSets: confusionAromaSetsSchema,
  whyConfusing: z.string(),
  howToDistinguish: z.string(),
});
export type ConfusionDistractor = z.infer<typeof confusionDistractorSchema>;

export const confusionGroupResponseSchema = z.object({
  targetStyleId: z.string(),
  difficulty: confusionDifficultySchema,
  distractors: z.array(confusionDistractorSchema),
  insufficientCandidates: z.boolean(),
  generatedAt: z.string(),
});
export type ConfusionGroupResponse = z.infer<
  typeof confusionGroupResponseSchema
>;

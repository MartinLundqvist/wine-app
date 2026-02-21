import { z } from "zod";

// Enums (for API validation / types)
export const grapeColorSchema = z.enum(["red", "white"]);
export const domainSchema = z.enum([
  "appearance",
  "nose",
  "palate",
  "conclusion",
]);
export const scaleTypeSchema = z.enum(["ordinal", "categorical"]);
export const wineCategorySchema = z.enum(["still", "sparkling", "fortified"]);
export const producedColorSchema = z.enum(["red", "white", "rose"]);
export const aromaSourceSchema = z.enum(["primary", "secondary", "tertiary"]);
export const styleKindSchema = z.enum([
  "grape_archetype",
  "regional_benchmark",
  "method_benchmark",
  "commercial_modern",
]);
export const confidenceSchema = z.enum(["high", "medium", "low"]);
export const statusSchema = z.enum(["draft", "approved", "deprecated"]);
export const grapeRoleSchema = z.enum(["primary", "blending"]);
export const prominenceSchema = z.enum(["dominant", "supporting", "optional"]);
export const continentalitySchema = z.enum([
  "maritime",
  "continental",
  "mixed",
]);
export const malolacticSchema = z.enum(["none", "partial", "full"]);

// Kept for exercise layer
export const wineColorSchema = z.enum(["red", "white"]);
export const exerciseFormatSchema = z.enum([
  "map_place",
  "map_recall",
  "order_rank",
  "descriptor_match",
  "structure_deduction",
  "elimination",
  "skeleton_deduction",
  "tasting_input",
]);
export const difficultySchema = z.enum(["easy", "medium", "hard", "expert"]);

// Truth layer
export const grapeSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  color: grapeColorSchema,
  sortOrder: z.number(),
  notes: z.string().nullable().optional(),
});
export type Grape = z.infer<typeof grapeSchema>;

export const regionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  country: z.string(),
  parentRegionId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type Region = z.infer<typeof regionSchema>;

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

export const structureDimensionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  domain: domainSchema,
  scaleType: scaleTypeSchema,
  scaleMin: z.number().nullable().optional(),
  scaleMax: z.number().nullable().optional(),
  scaleLabels: z.unknown().nullable().optional(),
  description: z.string().nullable().optional(),
});
export type StructureDimension = z.infer<typeof structureDimensionSchema>;

export const aromaTermSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  parentId: z.string().nullable().optional(),
  source: aromaSourceSchema,
  description: z.string().nullable().optional(),
});
export type AromaTerm = z.infer<typeof aromaTermSchema>;

export const styleTargetSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  regionId: z.string().nullable().optional(),
  styleKind: styleKindSchema,
  wineCategory: wineCategorySchema,
  producedColor: producedColorSchema,
  ladderTier: z.number(),
  confidence: confidenceSchema,
  status: statusSchema,
  authoringBasis: z.string().nullable().optional(),
  notesInternal: z.string().nullable().optional(),
});
export type StyleTarget = z.infer<typeof styleTargetSchema>;

export const styleTargetGrapeSchema = z.object({
  styleTargetId: z.string(),
  grapeId: z.string(),
  percentage: z.number().nullable().optional(),
  role: grapeRoleSchema,
});
export type StyleTargetGrape = z.infer<typeof styleTargetGrapeSchema>;

export const styleTargetStructureSchema = z.object({
  styleTargetId: z.string(),
  structureDimensionId: z.string(),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  categoricalValue: z.string().nullable().optional(),
  confidence: confidenceSchema,
});
export type StyleTargetStructure = z.infer<typeof styleTargetStructureSchema>;

export const styleTargetAromaProfileSchema = z.object({
  styleTargetId: z.string(),
  aromaTermId: z.string(),
  prominence: prominenceSchema,
});
export type StyleTargetAromaProfile = z.infer<
  typeof styleTargetAromaProfileSchema
>;

// Metadata layer
export const thermalBandSchema = z.object({
  id: z.string(),
  description: z.string().nullable().optional(),
});
export type ThermalBand = z.infer<typeof thermalBandSchema>;

export const styleTargetContextSchema = z.object({
  styleTargetId: z.string(),
  thermalBandId: z.string().nullable().optional(),
  elevationMeters: z.number().nullable().optional(),
  continentality: continentalitySchema.nullable().optional(),
  oakNewPercentageRange: z.string().nullable().optional(),
  oakType: z.string().nullable().optional(),
  malolacticConversion: malolacticSchema.nullable().optional(),
  leesAging: z.boolean().nullable().optional(),
  wholeCluster: z.boolean().nullable().optional(),
  carbonicMaceration: z.boolean().nullable().optional(),
  skinContactWhite: z.boolean().nullable().optional(),
  agingVessel: z.string().nullable().optional(),
  agingPotentialYearsMin: z.number().nullable().optional(),
  agingPotentialYearsMax: z.number().nullable().optional(),
  expectedQualityMin: z.number().nullable().optional(),
  expectedQualityMax: z.number().nullable().optional(),
  expectDeposit: z.boolean().nullable().optional(),
  expectPetillance: z.boolean().nullable().optional(),
  commonTertiaryAromas: z.string().nullable().optional(),
  structureEvolutionNotes: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type StyleTargetContext = z.infer<typeof styleTargetContextSchema>;

// Composite types for API responses
export const grapeWithStyleTargetsSchema = grapeSchema.extend({
  styleTargetIds: z.array(z.string()).optional(),
});
export type GrapeWithStyleTargets = z.infer<typeof grapeWithStyleTargetsSchema>;

export const styleTargetStructureWithDimensionSchema =
  styleTargetStructureSchema.extend({
    dimension: structureDimensionSchema.optional(),
  });
export type StyleTargetStructureWithDimension = z.infer<
  typeof styleTargetStructureWithDimensionSchema
>;

export const styleTargetAromaWithTermSchema = styleTargetAromaProfileSchema.extend(
  {
    term: aromaTermSchema.optional(),
  }
);
export type StyleTargetAromaWithTerm = z.infer<
  typeof styleTargetAromaWithTermSchema
>;

export const styleTargetFullSchema = styleTargetSchema.extend({
  region: regionSchema.nullable().optional(),
  grapes: z
    .array(
      z.object({
        grape: grapeSchema,
        percentage: z.number().nullable().optional(),
        role: grapeRoleSchema,
      })
    )
    .optional(),
  structure: z.array(styleTargetStructureWithDimensionSchema).optional(),
  aromas: z.array(styleTargetAromaWithTermSchema).optional(),
  context: styleTargetContextSchema.nullable().optional(),
});
export type StyleTargetFull = z.infer<typeof styleTargetFullSchema>;

export type RegionWithChildren = z.infer<typeof regionSchema> & {
  children?: RegionWithChildren[];
};
export const regionWithChildrenSchema: z.ZodType<RegionWithChildren> =
  regionSchema.extend({
    children: z.lazy(() => z.array(regionWithChildrenSchema)).optional(),
  });

export type AromaTermWithChildren = z.infer<typeof aromaTermSchema> & {
  children?: AromaTermWithChildren[];
};
export const aromaTermWithChildrenSchema: z.ZodType<AromaTermWithChildren> =
  aromaTermSchema.extend({
    children: z.lazy(() => z.array(aromaTermWithChildrenSchema)).optional(),
  });

// Exercise layer (unchanged for now)
export const exerciseTemplateSchema = z.object({
  exerciseTemplateId: z.string(),
  name: z.string(),
  level: z.number(),
  wineColor: z.string(),
  format: exerciseFormatSchema,
  promptStem: z.string(),
  testedAttributeIds: z.string(),
  selectionRules: z.string(),
  correctnessRules: z.string(),
  difficulty: difficultySchema,
  timeLimitMs: z.number().nullable().optional(),
});
export type ExerciseTemplate = z.infer<typeof exerciseTemplateSchema>;

// Response schemas
export const grapesResponseSchema = z.array(grapeSchema);
export const regionsResponseSchema = z.array(regionSchema);
export const structureDimensionsResponseSchema = z.array(
  structureDimensionSchema
);
export const aromaTermsResponseSchema = z.array(aromaTermSchema);
export const thermalBandsResponseSchema = z.array(thermalBandSchema);
export const styleTargetsResponseSchema = z.array(styleTargetFullSchema);
export const styleTargetResponseSchema = styleTargetFullSchema;
export const exerciseTemplatesResponseSchema = z.array(exerciseTemplateSchema);

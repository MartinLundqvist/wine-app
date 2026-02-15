import { z } from "zod";

export const wineColorSchema = z.enum(["red", "white"]);
export const wineColorScopeSchema = z.enum(["red", "white", "mixed", "both"]);
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
export const relevanceSchema = z.enum(["primary", "secondary", "occasional"]);
export const descriptorCategorySchema = z.enum([
  "fruit",
  "floral",
  "herbal",
  "spice",
  "earth",
  "oak",
]);

export const grapeSchema = z.object({
  grapeId: z.string(),
  name: z.string(),
  wineColor: wineColorSchema,
  level: z.number(),
  canonicalStyleTargetId: z.string(),
  aliases: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type Grape = z.infer<typeof grapeSchema>;

export const styleTargetSchema = z.object({
  styleTargetId: z.string(),
  grapeId: z.string(),
  name: z.string(),
  wineColor: wineColorSchema,
  level: z.number(),
  isPrimaryForGrape: z.boolean(),
  description: z.string().nullable().optional(),
  version: z.number(),
});
export type StyleTarget = z.infer<typeof styleTargetSchema>;

export const styleTargetWithAttributesSchema = styleTargetSchema.extend({
  attributes: z.record(z.union([z.number(), z.string()])).optional(),
});
export type StyleTargetWithAttributes = z.infer<typeof styleTargetWithAttributesSchema>;

export const attributeSchema = z.object({
  attributeId: z.string(),
  name: z.string(),
  wineColorScope: wineColorScopeSchema,
  dataType: z.enum(["ordinal", "categorical"]),
  scaleKey: z.string().nullable().optional(),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  allowedValues: z.string().nullable().optional(),
  description: z.string(),
  sortOrder: z.number(),
});
export type Attribute = z.infer<typeof attributeSchema>;

export const descriptorSchema = z.object({
  descriptorId: z.string(),
  name: z.string(),
  category: descriptorCategorySchema,
  wineColorScope: wineColorScopeSchema,
  description: z.string().nullable().optional(),
});
export type Descriptor = z.infer<typeof descriptorSchema>;

export const descriptorWithStyleTargetsSchema = descriptorSchema.extend({
  styleTargetIds: z.array(z.string()).optional(),
});
export type DescriptorWithStyleTargets = z.infer<typeof descriptorWithStyleTargetsSchema>;

export const exerciseTemplateSchema = z.object({
  exerciseTemplateId: z.string(),
  name: z.string(),
  level: z.number(),
  wineColor: z.string(),
  format: exerciseFormatSchema,
  promptStem: z.string(),
  testedAttributeIds: z.string(), // JSON string
  selectionRules: z.string(),
  correctnessRules: z.string(),
  difficulty: difficultySchema,
  timeLimitMs: z.number().nullable().optional(),
});
export type ExerciseTemplate = z.infer<typeof exerciseTemplateSchema>;

export const grapesResponseSchema = z.array(grapeSchema);
export const styleTargetsResponseSchema = z.array(styleTargetWithAttributesSchema);
export const attributesResponseSchema = z.array(attributeSchema);
export const descriptorsResponseSchema = z.array(descriptorWithStyleTargetsSchema);
export const exerciseTemplatesResponseSchema = z.array(exerciseTemplateSchema);

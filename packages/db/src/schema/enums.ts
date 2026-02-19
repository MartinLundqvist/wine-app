import { pgEnum } from "drizzle-orm/pg-core";

// Kept for user/exercise layer
export const wineColorEnum = pgEnum("wine_color", ["red", "white"]);
export const masteryStateEnum = pgEnum("mastery_state", [
  "locked",
  "in_progress",
  "mastered",
]);
export const exerciseFormatEnum = pgEnum("exercise_format", [
  "map_place",
  "map_recall",
  "order_rank",
  "descriptor_match",
  "structure_deduction",
  "elimination",
  "skeleton_deduction",
  "tasting_input",
]);
export const difficultyEnum = pgEnum("difficulty", [
  "easy",
  "medium",
  "hard",
  "expert",
]);

// Wine knowledge engine v4 enums
export const grapeColorEnum = pgEnum("grape_color", ["red", "white"]);
export const domainEnum = pgEnum("structure_domain", [
  "appearance",
  "structural",
]);
export const scaleTypeEnum = pgEnum("scale_type", [
  "ordinal_5",
  "ordinal_3",
  "categorical",
]);
export const aromaSourceEnum = pgEnum("aroma_source", [
  "primary",
  "secondary",
  "tertiary",
]);
export const styleKindEnum = pgEnum("style_kind", [
  "grape_archetype",
  "regional_benchmark",
  "method_benchmark",
  "commercial_modern",
]);
export const confidenceEnum = pgEnum("confidence", ["high", "medium", "low"]);
export const statusEnum = pgEnum("style_status", [
  "draft",
  "approved",
  "deprecated",
]);
export const grapeRoleEnum = pgEnum("grape_role", ["primary", "blending"]);
export const prominenceEnum = pgEnum("prominence", [
  "dominant",
  "supporting",
  "optional",
]);
export const continentalityEnum = pgEnum("continentality", [
  "maritime",
  "continental",
  "mixed",
]);
export const malolacticEnum = pgEnum("malolactic_conversion", [
  "none",
  "partial",
  "full",
]);

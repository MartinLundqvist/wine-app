import { pgEnum } from "drizzle-orm/pg-core";

// User / exercise layer (unchanged)
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

// Wine knowledge engine (v2)
export const grapeColorEnum = pgEnum("grape_color", ["red", "white"]);
export const wineCategoryEnum = pgEnum("wine_category", [
  "still",
  "sparkling",
  "fortified",
]);
export const producedColorEnum = pgEnum("produced_color", [
  "red",
  "white",
  "rose",
]);
export const styleTypeEnum = pgEnum("style_type", [
  "global_archetype",
  "regional_archetype",
  "appellation_archetype",
  "specific_bottle",
]);
export const regionLevelEnum = pgEnum("region_level", [
  "country",
  "region",
  "sub_region",
  "appellation",
  "vineyard",
]);
export const descriptorSalienceEnum = pgEnum("descriptor_salience", [
  "dominant",
  "supporting",
  "occasional",
]);

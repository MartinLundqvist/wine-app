import { pgEnum } from "drizzle-orm/pg-core";

export const wineColorEnum = pgEnum("wine_color", ["red", "white"]);
export const wineColorScopeEnum = pgEnum("wine_color_scope", ["red", "white", "mixed", "both"]);
export const masteryStateEnum = pgEnum("mastery_state", ["locked", "in_progress", "mastered"]);
export const dataTypeEnum = pgEnum("data_type", ["ordinal", "categorical"]);
export const scaleKeyEnum = pgEnum("scale_key", [
  "ordinal_1_5",
  "color_intensity_1_3",
  "sweetness_1_5",
]);
export const descriptorCategoryEnum = pgEnum("descriptor_category", [
  "fruit",
  "floral",
  "herbal",
  "spice",
  "earth",
  "oak",
]);
export const relevanceEnum = pgEnum("relevance", ["primary", "secondary", "occasional"]);
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
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard", "expert"]);
export const confusionSetRoleEnum = pgEnum("confusion_set_role", ["core", "distractor"]);
export const generationMethodEnum = pgEnum("generation_method", [
  "manual",
  "distance",
  "telemetry",
]);

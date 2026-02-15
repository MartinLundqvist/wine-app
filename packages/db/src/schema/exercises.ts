import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  jsonb,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { exerciseFormatEnum, difficultyEnum } from "./enums";
import { user } from "./users";

export const exerciseTemplate = pgTable("exercise_template", {
  exerciseTemplateId: varchar("exercise_template_id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  level: integer("level").notNull().default(1),
  wineColor: varchar("wine_color", { length: 16 }).notNull(), // red | white | mixed
  format: exerciseFormatEnum("format").notNull(),
  promptStem: text("prompt_stem").notNull(),
  testedAttributeIds: text("tested_attribute_ids").notNull(), // JSON array
  selectionRules: text("selection_rules").notNull(), // JSON object
  correctnessRules: text("correctness_rules").notNull(), // JSON object
  ambiguityGuardrails: text("ambiguity_guardrails"), // JSON object
  feedbackTemplate: text("feedback_template"), // JSON object
  difficulty: difficultyEnum("difficulty").notNull(),
  timeLimitMs: integer("time_limit_ms"),
});

export const exerciseInstance = pgTable("exercise_instance", {
  exerciseInstanceId: uuid("exercise_instance_id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.userId, { onDelete: "cascade" }),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  exerciseTemplateId: varchar("exercise_template_id", { length: 64 })
    .notNull()
    .references(() => exerciseTemplate.exerciseTemplateId, { onDelete: "cascade" }),
  seed: integer("seed").notNull(),
  payload: jsonb("payload").notNull(),
  userAnswer: jsonb("user_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  score: real("score").notNull(),
  responseTimeMs: integer("response_time_ms"),
  bottleId: varchar("bottle_id", { length: 64 }),
});

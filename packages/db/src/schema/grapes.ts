import { pgTable, varchar, integer, text, boolean } from "drizzle-orm/pg-core";
import { wineColorEnum } from "./enums";

export const grape = pgTable("grape", {
  grapeId: varchar("grape_id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  wineColor: wineColorEnum("wine_color").notNull(),
  level: integer("level").notNull().default(1),
  canonicalStyleTargetId: varchar("canonical_style_target_id", { length: 64 }).notNull(),
  aliases: text("aliases"),
  notes: text("notes"),
});

export const styleTarget = pgTable("style_target", {
  styleTargetId: varchar("style_target_id", { length: 64 }).primaryKey(),
  grapeId: varchar("grape_id", { length: 64 })
    .notNull()
    .references(() => grape.grapeId, { onDelete: "cascade" }),
  name: varchar("name", { length: 128 }).notNull(),
  wineColor: wineColorEnum("wine_color").notNull(),
  level: integer("level").notNull().default(1),
  isPrimaryForGrape: boolean("is_primary_for_grape").notNull(),
  description: text("description"),
  version: integer("version").notNull().default(1),
});

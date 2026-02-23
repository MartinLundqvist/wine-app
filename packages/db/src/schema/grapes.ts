import {
  pgTable,
  varchar,
  integer,
  text,
  jsonb,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  styleTypeEnum,
  producedColorEnum,
  wineCategoryEnum,
  regionLevelEnum,
  grapeColorEnum,
} from "./enums";

// Geography: single self-referencing table with level enum
export const region = pgTable(
  "region",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    displayName: varchar("display_name", { length: 128 }).notNull(),
    regionLevel: regionLevelEnum("region_level").notNull(),
    parentId: varchar("parent_id", { length: 64 }),
    notes: text("notes"),
  },
  (table) => [
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "region_parent_id_fkey",
    }),
  ]
);

// Ordinal label sets for 1-5 axes (structure dimensions + climate)
export const ordinalScale = pgTable("ordinal_scale", {
  id: varchar("id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  labels: jsonb("labels").$type<string[]>().notNull(), // [label_1, ..., label_5]
});

// Grape varieties
export const grapeVariety = pgTable("grape_variety", {
  id: varchar("id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  color: grapeColorEnum("color").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  notes: text("notes"),
});

// Core wine style entity (climate inline; single region FK)
export const wineStyle = pgTable(
  "wine_style",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    displayName: varchar("display_name", { length: 128 }).notNull(),
    styleType: styleTypeEnum("style_type").notNull(),
    producedColor: producedColorEnum("produced_color").notNull(),
    wineCategory: wineCategoryEnum("wine_category").notNull().default("still"),
    regionId: varchar("region_id", { length: 64 }).references(() => region.id, {
      onDelete: "set null",
    }),
    climateMin: integer("climate_min"),
    climateMax: integer("climate_max"),
    climateOrdinalScaleId: varchar("climate_ordinal_scale_id", { length: 64 }).references(
      () => ordinalScale.id,
      { onDelete: "set null" }
    ),
    notes: text("notes"),
  },
  (t) => [
    sql`CHECK ((climate_min IS NULL AND climate_max IS NULL) OR (climate_min IS NOT NULL AND climate_max IS NOT NULL AND climate_min >= 1 AND climate_min <= 5 AND climate_max >= 1 AND climate_max <= 5 AND climate_min <= climate_max))`,
  ]
);

// Blend: style -> grapes with optional percentage
export const wineStyleGrape = pgTable(
  "wine_style_grape",
  {
    wineStyleId: varchar("wine_style_id", { length: 64 })
      .notNull()
      .references(() => wineStyle.id, { onDelete: "cascade" }),
    grapeVarietyId: varchar("grape_variety_id", { length: 64 })
      .notNull()
      .references(() => grapeVariety.id, { onDelete: "cascade" }),
    percentage: integer("percentage"),
  },
  (t) => [
    primaryKey({ columns: [t.wineStyleId, t.grapeVarietyId] }),
    sql`CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))`,
  ]
);

import {
  pgTable,
  varchar,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { ordinalScale } from "./grapes";
import { wineStyle } from "./grapes";

export const structureDimension = pgTable("structure_dimension", {
  id: varchar("id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  ordinalScaleId: varchar("ordinal_scale_id", { length: 64 })
    .notNull()
    .references(() => ordinalScale.id, { onDelete: "restrict" }),
});

export const wineStyleStructure = pgTable(
  "wine_style_structure",
  {
    wineStyleId: varchar("wine_style_id", { length: 64 })
      .notNull()
      .references(() => wineStyle.id, { onDelete: "cascade" }),
    structureDimensionId: varchar("structure_dimension_id", { length: 64 })
      .notNull()
      .references(() => structureDimension.id, { onDelete: "cascade" }),
    minValue: integer("min_value").notNull(),
    maxValue: integer("max_value").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.wineStyleId, t.structureDimensionId] }),
    sql`CHECK (min_value >= 1 AND min_value <= 5 AND max_value >= 1 AND max_value <= 5 AND min_value <= max_value)`,
  ]
);

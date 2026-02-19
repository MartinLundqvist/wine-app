import {
  pgTable,
  varchar,
  integer,
  text,
  primaryKey,
} from "drizzle-orm/pg-core";
import { domainEnum, scaleTypeEnum, confidenceEnum } from "./enums";
import { styleTarget } from "./grapes";

export const structureDimension = pgTable("structure_dimension", {
  id: varchar("id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  domain: domainEnum("domain").notNull(),
  scaleType: scaleTypeEnum("scale_type").notNull(),
  scaleMin: integer("scale_min"),
  scaleMax: integer("scale_max"),
  description: text("description"),
});

export const styleTargetStructure = pgTable(
  "style_target_structure",
  {
    styleTargetId: varchar("style_target_id", { length: 64 })
      .notNull()
      .references(() => styleTarget.id, { onDelete: "cascade" }),
    structureDimensionId: varchar("structure_dimension_id", { length: 64 })
      .notNull()
      .references(() => structureDimension.id, { onDelete: "cascade" }),
    minValue: integer("min_value"),
    maxValue: integer("max_value"),
    categoricalValue: varchar("categorical_value", { length: 64 }),
    confidence: confidenceEnum("confidence").notNull(),
  },
  (t) => [primaryKey({ columns: [t.styleTargetId, t.structureDimensionId] })]
);

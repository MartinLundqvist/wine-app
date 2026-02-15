import {
  pgTable,
  varchar,
  integer,
  text,
  primaryKey,
  real,
} from "drizzle-orm/pg-core";
import { wineColorScopeEnum, dataTypeEnum, scaleKeyEnum } from "./enums";
import { styleTarget } from "./grapes";

export const attribute = pgTable("attribute", {
  attributeId: varchar("attribute_id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  wineColorScope: wineColorScopeEnum("wine_color_scope").notNull(),
  dataType: dataTypeEnum("data_type").notNull(),
  scaleKey: scaleKeyEnum("scale_key"),
  minValue: integer("min_value"),
  maxValue: integer("max_value"),
  allowedValues: text("allowed_values"),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const styleTargetAttribute = pgTable(
  "style_target_attribute",
  {
    styleTargetId: varchar("style_target_id", { length: 64 })
      .notNull()
      .references(() => styleTarget.styleTargetId, { onDelete: "cascade" }),
    attributeId: varchar("attribute_id", { length: 64 })
      .notNull()
      .references(() => attribute.attributeId, { onDelete: "cascade" }),
    valueOrdinal: integer("value_ordinal"),
    valueCategorical: varchar("value_categorical", { length: 64 }),
    source: varchar("source", { length: 255 }),
    confidence: real("confidence"),
    notes: text("notes"),
  },
  (t) => [primaryKey({ columns: [t.styleTargetId, t.attributeId] })]
);

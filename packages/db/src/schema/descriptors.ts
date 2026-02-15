import { pgTable, varchar, text, primaryKey } from "drizzle-orm/pg-core";
import { wineColorScopeEnum, descriptorCategoryEnum, relevanceEnum } from "./enums";
import { styleTarget } from "./grapes";

export const descriptor = pgTable("descriptor", {
  descriptorId: varchar("descriptor_id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  category: descriptorCategoryEnum("category").notNull(),
  wineColorScope: wineColorScopeEnum("wine_color_scope").notNull(),
  description: text("description"),
  intensityScaleKey: varchar("intensity_scale_key", { length: 32 }),
});

export const styleTargetDescriptor = pgTable(
  "style_target_descriptor",
  {
    styleTargetId: varchar("style_target_id", { length: 64 })
      .notNull()
      .references(() => styleTarget.styleTargetId, { onDelete: "cascade" }),
    descriptorId: varchar("descriptor_id", { length: 64 })
      .notNull()
      .references(() => descriptor.descriptorId, { onDelete: "cascade" }),
    relevance: relevanceEnum("relevance").notNull(),
    notes: text("notes"),
  },
  (t) => [primaryKey({ columns: [t.styleTargetId, t.descriptorId] })]
);

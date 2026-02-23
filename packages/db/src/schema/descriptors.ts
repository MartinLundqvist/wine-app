import {
  pgTable,
  varchar,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { descriptorSalienceEnum } from "./enums";
import { wineStyle } from "./grapes";

// Aroma taxonomy: source (primary/secondary/tertiary)
export const aromaSource = pgTable("aroma_source", {
  id: varchar("id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
});

// Clusters under each source (e.g. Green Fruit, Oak)
export const aromaCluster = pgTable("aroma_cluster", {
  id: varchar("id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  aromaSourceId: varchar("aroma_source_id", { length: 64 })
    .notNull()
    .references(() => aromaSource.id, { onDelete: "cascade" }),
});

// Descriptors under each cluster (e.g. Apple, Vanilla)
export const aromaDescriptor = pgTable("aroma_descriptor", {
  id: varchar("id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  aromaClusterId: varchar("aroma_cluster_id", { length: 64 })
    .notNull()
    .references(() => aromaCluster.id, { onDelete: "cascade" }),
});

// Style -> cluster: intensity range 1-5
export const wineStyleAromaCluster = pgTable(
  "wine_style_aroma_cluster",
  {
    wineStyleId: varchar("wine_style_id", { length: 64 })
      .notNull()
      .references(() => wineStyle.id, { onDelete: "cascade" }),
    aromaClusterId: varchar("aroma_cluster_id", { length: 64 })
      .notNull()
      .references(() => aromaCluster.id, { onDelete: "cascade" }),
    intensityMin: integer("intensity_min").notNull(),
    intensityMax: integer("intensity_max").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.wineStyleId, t.aromaClusterId] }),
    sql`CHECK (intensity_min >= 1 AND intensity_min <= 5 AND intensity_max >= 1 AND intensity_max <= 5 AND intensity_min <= intensity_max)`,
  ]
);

// Style -> descriptor: salience
export const wineStyleAromaDescriptor = pgTable(
  "wine_style_aroma_descriptor",
  {
    wineStyleId: varchar("wine_style_id", { length: 64 })
      .notNull()
      .references(() => wineStyle.id, { onDelete: "cascade" }),
    aromaDescriptorId: varchar("aroma_descriptor_id", { length: 64 })
      .notNull()
      .references(() => aromaDescriptor.id, { onDelete: "cascade" }),
    salience: descriptorSalienceEnum("salience").notNull(),
  },
  (t) => [primaryKey({ columns: [t.wineStyleId, t.aromaDescriptorId] })]
);

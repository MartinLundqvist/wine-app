import {
  pgTable,
  varchar,
  integer,
  text,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";
import {
  grapeColorEnum,
  styleKindEnum,
  confidenceEnum,
  statusEnum,
  grapeRoleEnum,
} from "./enums";

export const region = pgTable(
  "region",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    displayName: varchar("display_name", { length: 128 }).notNull(),
    country: varchar("country", { length: 64 }).notNull(),
    parentRegionId: varchar("parent_region_id", { length: 64 }),
    notes: text("notes"),
  },
  (table) => ({
    parentFk: foreignKey({
      columns: [table.parentRegionId],
      foreignColumns: [table.id],
      name: "region_parent_region_id_fkey",
    }),
  })
);

export const grape = pgTable("grape", {
  id: varchar("id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  color: grapeColorEnum("color").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  notes: text("notes"),
});

export const styleTarget = pgTable("style_target", {
  id: varchar("id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  regionId: varchar("region_id", { length: 64 }).references(() => region.id, {
    onDelete: "set null",
  }),
  styleKind: styleKindEnum("style_kind").notNull(),
  ladderTier: integer("ladder_tier").notNull().default(1),
  confidence: confidenceEnum("confidence").notNull(),
  status: statusEnum("status").notNull().default("approved"),
  authoringBasis: text("authoring_basis"),
  notesInternal: text("notes_internal"),
});

export const styleTargetGrape = pgTable(
  "style_target_grape",
  {
    styleTargetId: varchar("style_target_id", { length: 64 })
      .notNull()
      .references(() => styleTarget.id, { onDelete: "cascade" }),
    grapeId: varchar("grape_id", { length: 64 })
      .notNull()
      .references(() => grape.id, { onDelete: "cascade" }),
    percentage: integer("percentage"), // null when sole grape (implicit 100%)
    role: grapeRoleEnum("role").notNull(),
  },
  (t) => [primaryKey({ columns: [t.styleTargetId, t.grapeId] })]
);

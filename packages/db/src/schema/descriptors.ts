import {
  pgTable,
  varchar,
  text,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";
import { aromaSourceEnum, prominenceEnum } from "./enums";
import { styleTarget } from "./grapes";

export const aromaTerm = pgTable(
  "aroma_term",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    displayName: varchar("display_name", { length: 128 }).notNull(),
    parentId: varchar("parent_id", { length: 64 }),
    source: aromaSourceEnum("source").notNull(),
    description: text("description"),
  },
  (table) => ({
    parentFk: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "aroma_term_parent_id_fkey",
    }),
  })
);

export const styleTargetAromaProfile = pgTable(
  "style_target_aroma_profile",
  {
    styleTargetId: varchar("style_target_id", { length: 64 })
      .notNull()
      .references(() => styleTarget.id, { onDelete: "cascade" }),
    aromaTermId: varchar("aroma_term_id", { length: 64 })
      .notNull()
      .references(() => aromaTerm.id, { onDelete: "cascade" }),
    prominence: prominenceEnum("prominence").notNull(),
  },
  (t) => [primaryKey({ columns: [t.styleTargetId, t.aromaTermId] })]
);

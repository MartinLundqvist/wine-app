import {
  pgTable,
  varchar,
  integer,
  text,
  real,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { wineColorEnum } from "./enums";
import { styleTarget } from "./grapes";

export const wineBottle = pgTable("wine_bottle", {
  bottleId: varchar("bottle_id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  wineColor: wineColorEnum("wine_color").notNull(),
  region: varchar("region", { length: 128 }),
  vintage: integer("vintage"),
  grapesLabel: varchar("grapes_label", { length: 255 }),
  notes: text("notes"),
  teachingNotes: text("teaching_notes").notNull(),
});

export const bottleStyleMatch = pgTable(
  "bottle_style_match",
  {
    bottleId: varchar("bottle_id", { length: 64 })
      .notNull()
      .references(() => wineBottle.bottleId, { onDelete: "cascade" }),
    styleTargetId: varchar("style_target_id", { length: 64 })
      .notNull()
      .references(() => styleTarget.styleTargetId, { onDelete: "cascade" }),
    matchScore: real("match_score").notNull(),
    isPrimaryMatch: boolean("is_primary_match").notNull(),
    deviationNotes: text("deviation_notes"),
    curator: varchar("curator", { length: 128 }),
  },
  (t) => [primaryKey({ columns: [t.bottleId, t.styleTargetId] })]
);

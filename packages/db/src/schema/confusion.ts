import { pgTable, varchar, integer, text, real, primaryKey } from "drizzle-orm/pg-core";
import { wineColorEnum, confusionSetRoleEnum, generationMethodEnum } from "./enums";
import { styleTarget } from "./grapes";

export const confusionSet = pgTable("confusion_set", {
  confusionSetId: varchar("confusion_set_id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  wineColor: wineColorEnum("wine_color").notNull(),
  level: integer("level").notNull().default(1),
  rationale: text("rationale"),
  generationMethod: generationMethodEnum("generation_method"),
});

export const confusionSetMember = pgTable(
  "confusion_set_member",
  {
    confusionSetId: varchar("confusion_set_id", { length: 64 })
      .notNull()
      .references(() => confusionSet.confusionSetId, { onDelete: "cascade" }),
    styleTargetId: varchar("style_target_id", { length: 64 })
      .notNull()
      .references(() => styleTarget.styleTargetId, { onDelete: "cascade" }),
    role: confusionSetRoleEnum("role"),
    weight: real("weight"),
  },
  (t) => [primaryKey({ columns: [t.confusionSetId, t.styleTargetId] })]
);

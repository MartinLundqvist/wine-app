import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/pg-core";
import { masteryStateEnum, userRoleEnum } from "./enums";

export const user = pgTable("user", {
  userId: uuid("user_id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
});

export const userProgress = pgTable(
  "user_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => user.userId, { onDelete: "cascade" }),
    exerciseFormat: varchar("exercise_format", { length: 64 }).notNull(),
    wineColor: varchar("wine_color", { length: 16 }).notNull(), // red | white | mixed | both
    totalAttempts: integer("total_attempts").notNull().default(0),
    correctAttempts: integer("correct_attempts").notNull().default(0),
    accuracy: real("accuracy").notNull().default(0),
    avgResponseTimeMs: integer("avg_response_time_ms"),
    masteryState: masteryStateEnum("mastery_state").notNull().default("locked"),
    lastAttemptedAt: timestamp("last_attempted_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.exerciseFormat, t.wineColor] })]
);

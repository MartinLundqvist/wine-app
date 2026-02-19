import {
  pgTable,
  varchar,
  integer,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { continentalityEnum, malolacticEnum } from "./enums";
import { styleTarget } from "./grapes";

export const thermalBand = pgTable("thermal_band", {
  id: varchar("id", { length: 64 }).primaryKey(),
  description: text("description"),
});

export const styleTargetContext = pgTable("style_target_context", {
  styleTargetId: varchar("style_target_id", { length: 64 })
    .primaryKey()
    .references(() => styleTarget.id, { onDelete: "cascade" }),
  thermalBandId: varchar("thermal_band_id", { length: 64 }).references(
    () => thermalBand.id,
    { onDelete: "set null" }
  ),
  elevationMeters: integer("elevation_meters"),
  continentality: continentalityEnum("continentality"),
  oakNewPercentageRange: text("oak_new_percentage_range"),
  oakType: text("oak_type"),
  malolacticConversion: malolacticEnum("malolactic_conversion"),
  leesAging: boolean("lees_aging"),
  wholeCluster: boolean("whole_cluster"),
  carbonicMaceration: boolean("carbonic_maceration"),
  skinContactWhite: boolean("skin_contact_white"),
  agingVessel: text("aging_vessel"),
  agingPotentialYearsMin: integer("aging_potential_years_min"),
  agingPotentialYearsMax: integer("aging_potential_years_max"),
  expectedQualityMin: integer("expected_quality_min"),
  expectedQualityMax: integer("expected_quality_max"),
  expectDeposit: boolean("expect_deposit"),
  expectPetillance: boolean("expect_petillance"),
  commonTertiaryAromas: text("common_tertiary_aromas"),
  structureEvolutionNotes: text("structure_evolution_notes"),
  notes: text("notes"),
});

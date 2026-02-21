import { pgTable, varchar, integer, real, boolean, primaryKey } from "drizzle-orm/pg-core";
import { region } from "./grapes";

export const countryMapConfig = pgTable("country_map_config", {
  countryName: varchar("country_name", { length: 64 }).primaryKey(),
  isoNumeric: integer("iso_numeric").notNull(),
  geoSlug: varchar("geo_slug", { length: 64 }).notNull(),
  naturalEarthAdminName: varchar("natural_earth_admin_name", { length: 128 }).notNull(),
  zoomCenterLon: real("zoom_center_lon").notNull(),
  zoomCenterLat: real("zoom_center_lat").notNull(),
  zoomLevel: real("zoom_level").notNull(),
  isMappable: boolean("is_mappable").notNull().default(true),
});

export const regionBoundaryMapping = pgTable(
  "region_boundary_mapping",
  {
    regionId: varchar("region_id", { length: 64 })
      .notNull()
      .references(() => region.id, { onDelete: "cascade" }),
    featureName: varchar("feature_name", { length: 128 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.regionId, t.featureName] })]
);

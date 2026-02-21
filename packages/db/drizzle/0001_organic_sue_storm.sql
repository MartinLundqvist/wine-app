CREATE TABLE IF NOT EXISTS "country_map_config" (
	"country_name" varchar(64) PRIMARY KEY NOT NULL,
	"iso_numeric" integer NOT NULL,
	"geo_slug" varchar(64) NOT NULL,
	"natural_earth_admin_name" varchar(128) NOT NULL,
	"zoom_center_lon" real NOT NULL,
	"zoom_center_lat" real NOT NULL,
	"zoom_level" real NOT NULL,
	"is_mappable" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "region_boundary_mapping" (
	"region_id" varchar(64) NOT NULL,
	"feature_name" varchar(128) NOT NULL,
	CONSTRAINT "region_boundary_mapping_region_id_feature_name_pk" PRIMARY KEY("region_id","feature_name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "region_boundary_mapping" ADD CONSTRAINT "region_boundary_mapping_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

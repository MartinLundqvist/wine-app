CREATE TABLE IF NOT EXISTS "appearance_dimension" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"produced_color" "produced_color",
	"ordinal_scale_id" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wine_style_appearance" (
	"wine_style_id" varchar(64) NOT NULL,
	"appearance_dimension_id" varchar(64) NOT NULL,
	"min_value" integer NOT NULL,
	"max_value" integer NOT NULL,
	CONSTRAINT "wine_style_appearance_wine_style_id_appearance_dimension_id_pk" PRIMARY KEY("wine_style_id","appearance_dimension_id"),
	CONSTRAINT "wine_style_appearance_values_check" CHECK (min_value >= 1 AND min_value <= 5 AND max_value >= 1 AND max_value <= 5 AND min_value <= max_value)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appearance_dimension" ADD CONSTRAINT "appearance_dimension_ordinal_scale_id_ordinal_scale_id_fk" FOREIGN KEY ("ordinal_scale_id") REFERENCES "public"."ordinal_scale"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style_appearance" ADD CONSTRAINT "wine_style_appearance_wine_style_id_wine_style_id_fk" FOREIGN KEY ("wine_style_id") REFERENCES "public"."wine_style"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style_appearance" ADD CONSTRAINT "wine_style_appearance_appearance_dimension_id_appearance_dimension_id_fk" FOREIGN KEY ("appearance_dimension_id") REFERENCES "public"."appearance_dimension"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

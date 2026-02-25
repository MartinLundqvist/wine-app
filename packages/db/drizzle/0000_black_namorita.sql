CREATE TYPE "public"."descriptor_salience" AS ENUM('dominant', 'supporting', 'occasional');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard', 'expert');--> statement-breakpoint
CREATE TYPE "public"."exercise_format" AS ENUM('map_place', 'map_recall', 'order_rank', 'descriptor_match', 'structure_deduction', 'elimination', 'skeleton_deduction', 'tasting_input');--> statement-breakpoint
CREATE TYPE "public"."grape_color" AS ENUM('red', 'white');--> statement-breakpoint
CREATE TYPE "public"."mastery_state" AS ENUM('locked', 'in_progress', 'mastered');--> statement-breakpoint
CREATE TYPE "public"."produced_color" AS ENUM('red', 'white', 'rose');--> statement-breakpoint
CREATE TYPE "public"."region_level" AS ENUM('country', 'region', 'sub_region', 'appellation', 'vineyard');--> statement-breakpoint
CREATE TYPE "public"."style_type" AS ENUM('global_archetype', 'regional_archetype', 'appellation_archetype', 'specific_bottle');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."wine_category" AS ENUM('still', 'sparkling', 'fortified');--> statement-breakpoint
CREATE TYPE "public"."wine_color" AS ENUM('red', 'white');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_progress" (
	"user_id" uuid NOT NULL,
	"exercise_format" varchar(64) NOT NULL,
	"wine_color" varchar(16) NOT NULL,
	"total_attempts" integer DEFAULT 0 NOT NULL,
	"correct_attempts" integer DEFAULT 0 NOT NULL,
	"accuracy" real DEFAULT 0 NOT NULL,
	"avg_response_time_ms" integer,
	"mastery_state" "mastery_state" DEFAULT 'locked' NOT NULL,
	"last_attempted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_progress_user_id_exercise_format_wine_color_pk" PRIMARY KEY("user_id","exercise_format","wine_color")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grape_variety" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"color" "grape_color" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ordinal_scale" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"labels" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "region" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"region_level" "region_level" NOT NULL,
	"parent_id" varchar(64),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wine_style" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"style_type" "style_type" NOT NULL,
	"produced_color" "produced_color" NOT NULL,
	"wine_category" "wine_category" DEFAULT 'still' NOT NULL,
	"region_id" varchar(64),
	"climate_min" integer,
	"climate_max" integer,
	"climate_ordinal_scale_id" varchar(64),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wine_style_grape" (
	"wine_style_id" varchar(64) NOT NULL,
	"grape_variety_id" varchar(64) NOT NULL,
	"percentage" integer,
	CONSTRAINT "wine_style_grape_wine_style_id_grape_variety_id_pk" PRIMARY KEY("wine_style_id","grape_variety_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "appearance_dimension" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"produced_color" "produced_color",
	"ordinal_scale_id" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "structure_dimension" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"ordinal_scale_id" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wine_style_appearance" (
	"wine_style_id" varchar(64) NOT NULL,
	"appearance_dimension_id" varchar(64) NOT NULL,
	"min_value" integer NOT NULL,
	"max_value" integer NOT NULL,
	CONSTRAINT "wine_style_appearance_wine_style_id_appearance_dimension_id_pk" PRIMARY KEY("wine_style_id","appearance_dimension_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wine_style_structure" (
	"wine_style_id" varchar(64) NOT NULL,
	"structure_dimension_id" varchar(64) NOT NULL,
	"min_value" integer NOT NULL,
	"max_value" integer NOT NULL,
	CONSTRAINT "wine_style_structure_wine_style_id_structure_dimension_id_pk" PRIMARY KEY("wine_style_id","structure_dimension_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aroma_cluster" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"aroma_source_id" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aroma_descriptor" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"aroma_cluster_id" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aroma_source" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wine_style_aroma_cluster" (
	"wine_style_id" varchar(64) NOT NULL,
	"aroma_cluster_id" varchar(64) NOT NULL,
	"intensity_min" integer NOT NULL,
	"intensity_max" integer NOT NULL,
	CONSTRAINT "wine_style_aroma_cluster_wine_style_id_aroma_cluster_id_pk" PRIMARY KEY("wine_style_id","aroma_cluster_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wine_style_aroma_descriptor" (
	"wine_style_id" varchar(64) NOT NULL,
	"aroma_descriptor_id" varchar(64) NOT NULL,
	"salience" "descriptor_salience" NOT NULL,
	CONSTRAINT "wine_style_aroma_descriptor_wine_style_id_aroma_descriptor_id_pk" PRIMARY KEY("wine_style_id","aroma_descriptor_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exercise_instance" (
	"exercise_instance_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"exercise_template_id" varchar(64) NOT NULL,
	"seed" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"user_answer" jsonb NOT NULL,
	"is_correct" boolean NOT NULL,
	"score" real NOT NULL,
	"response_time_ms" integer,
	"bottle_id" varchar(64)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exercise_template" (
	"exercise_template_id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"wine_color" varchar(16) NOT NULL,
	"format" "exercise_format" NOT NULL,
	"prompt_stem" text NOT NULL,
	"tested_attribute_ids" text NOT NULL,
	"selection_rules" text NOT NULL,
	"correctness_rules" text NOT NULL,
	"ambiguity_guardrails" text,
	"feedback_template" text,
	"difficulty" "difficulty" NOT NULL,
	"time_limit_ms" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "country_map_config" (
	"region_id" varchar(64) PRIMARY KEY NOT NULL,
	"iso_numeric" integer NOT NULL,
	"geo_slug" varchar(64) NOT NULL,
	"natural_earth_admin_name" varchar(128) NOT NULL,
	"zoom_center_lon" real NOT NULL,
	"zoom_center_lat" real NOT NULL,
	"zoom_level" real NOT NULL,
	"is_mappable" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "region_boundary_mapping" (
	"region_id" varchar(64) NOT NULL,
	"feature_name" varchar(128) NOT NULL,
	CONSTRAINT "region_boundary_mapping_region_id_feature_name_pk" PRIMARY KEY("region_id","feature_name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "region" ADD CONSTRAINT "region_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."region"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style" ADD CONSTRAINT "wine_style_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style" ADD CONSTRAINT "wine_style_climate_ordinal_scale_id_ordinal_scale_id_fk" FOREIGN KEY ("climate_ordinal_scale_id") REFERENCES "public"."ordinal_scale"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style_grape" ADD CONSTRAINT "wine_style_grape_wine_style_id_wine_style_id_fk" FOREIGN KEY ("wine_style_id") REFERENCES "public"."wine_style"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style_grape" ADD CONSTRAINT "wine_style_grape_grape_variety_id_grape_variety_id_fk" FOREIGN KEY ("grape_variety_id") REFERENCES "public"."grape_variety"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appearance_dimension" ADD CONSTRAINT "appearance_dimension_ordinal_scale_id_ordinal_scale_id_fk" FOREIGN KEY ("ordinal_scale_id") REFERENCES "public"."ordinal_scale"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "structure_dimension" ADD CONSTRAINT "structure_dimension_ordinal_scale_id_ordinal_scale_id_fk" FOREIGN KEY ("ordinal_scale_id") REFERENCES "public"."ordinal_scale"("id") ON DELETE restrict ON UPDATE no action;
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style_structure" ADD CONSTRAINT "wine_style_structure_wine_style_id_wine_style_id_fk" FOREIGN KEY ("wine_style_id") REFERENCES "public"."wine_style"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style_structure" ADD CONSTRAINT "wine_style_structure_structure_dimension_id_structure_dimension_id_fk" FOREIGN KEY ("structure_dimension_id") REFERENCES "public"."structure_dimension"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aroma_cluster" ADD CONSTRAINT "aroma_cluster_aroma_source_id_aroma_source_id_fk" FOREIGN KEY ("aroma_source_id") REFERENCES "public"."aroma_source"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aroma_descriptor" ADD CONSTRAINT "aroma_descriptor_aroma_cluster_id_aroma_cluster_id_fk" FOREIGN KEY ("aroma_cluster_id") REFERENCES "public"."aroma_cluster"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style_aroma_cluster" ADD CONSTRAINT "wine_style_aroma_cluster_wine_style_id_wine_style_id_fk" FOREIGN KEY ("wine_style_id") REFERENCES "public"."wine_style"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style_aroma_cluster" ADD CONSTRAINT "wine_style_aroma_cluster_aroma_cluster_id_aroma_cluster_id_fk" FOREIGN KEY ("aroma_cluster_id") REFERENCES "public"."aroma_cluster"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style_aroma_descriptor" ADD CONSTRAINT "wine_style_aroma_descriptor_wine_style_id_wine_style_id_fk" FOREIGN KEY ("wine_style_id") REFERENCES "public"."wine_style"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wine_style_aroma_descriptor" ADD CONSTRAINT "wine_style_aroma_descriptor_aroma_descriptor_id_aroma_descriptor_id_fk" FOREIGN KEY ("aroma_descriptor_id") REFERENCES "public"."aroma_descriptor"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_instance" ADD CONSTRAINT "exercise_instance_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_instance" ADD CONSTRAINT "exercise_instance_exercise_template_id_exercise_template_exercise_template_id_fk" FOREIGN KEY ("exercise_template_id") REFERENCES "public"."exercise_template"("exercise_template_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "country_map_config" ADD CONSTRAINT "country_map_config_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "region_boundary_mapping" ADD CONSTRAINT "region_boundary_mapping_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TYPE "public"."aroma_source" AS ENUM('primary', 'secondary', 'tertiary');--> statement-breakpoint
CREATE TYPE "public"."confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."continentality" AS ENUM('maritime', 'continental', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard', 'expert');--> statement-breakpoint
CREATE TYPE "public"."structure_domain" AS ENUM('appearance', 'structural');--> statement-breakpoint
CREATE TYPE "public"."exercise_format" AS ENUM('map_place', 'map_recall', 'order_rank', 'descriptor_match', 'structure_deduction', 'elimination', 'skeleton_deduction', 'tasting_input');--> statement-breakpoint
CREATE TYPE "public"."grape_color" AS ENUM('red', 'white');--> statement-breakpoint
CREATE TYPE "public"."grape_role" AS ENUM('primary', 'blending');--> statement-breakpoint
CREATE TYPE "public"."malolactic_conversion" AS ENUM('none', 'partial', 'full');--> statement-breakpoint
CREATE TYPE "public"."mastery_state" AS ENUM('locked', 'in_progress', 'mastered');--> statement-breakpoint
CREATE TYPE "public"."prominence" AS ENUM('dominant', 'supporting', 'optional');--> statement-breakpoint
CREATE TYPE "public"."scale_type" AS ENUM('ordinal_5', 'ordinal_3', 'categorical');--> statement-breakpoint
CREATE TYPE "public"."style_status" AS ENUM('draft', 'approved', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."style_kind" AS ENUM('grape_archetype', 'regional_benchmark', 'method_benchmark', 'commercial_modern');--> statement-breakpoint
CREATE TYPE "public"."wine_color" AS ENUM('red', 'white');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(255),
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
CREATE TABLE IF NOT EXISTS "grape" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"color" "grape_color" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "region" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"country" varchar(64) NOT NULL,
	"parent_region_id" varchar(64),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "style_target" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"region_id" varchar(64),
	"style_kind" "style_kind" NOT NULL,
	"ladder_tier" integer DEFAULT 1 NOT NULL,
	"confidence" "confidence" NOT NULL,
	"status" "style_status" DEFAULT 'approved' NOT NULL,
	"authoring_basis" text,
	"notes_internal" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "style_target_grape" (
	"style_target_id" varchar(64) NOT NULL,
	"grape_id" varchar(64) NOT NULL,
	"percentage" integer,
	"role" "grape_role" NOT NULL,
	CONSTRAINT "style_target_grape_style_target_id_grape_id_pk" PRIMARY KEY("style_target_id","grape_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "structure_dimension" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"domain" "structure_domain" NOT NULL,
	"scale_type" "scale_type" NOT NULL,
	"scale_min" integer,
	"scale_max" integer,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "style_target_structure" (
	"style_target_id" varchar(64) NOT NULL,
	"structure_dimension_id" varchar(64) NOT NULL,
	"min_value" integer,
	"max_value" integer,
	"categorical_value" varchar(64),
	"confidence" "confidence" NOT NULL,
	CONSTRAINT "style_target_structure_style_target_id_structure_dimension_id_pk" PRIMARY KEY("style_target_id","structure_dimension_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aroma_term" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"parent_id" varchar(64),
	"source" "aroma_source" NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "style_target_aroma_profile" (
	"style_target_id" varchar(64) NOT NULL,
	"aroma_term_id" varchar(64) NOT NULL,
	"prominence" "prominence" NOT NULL,
	CONSTRAINT "style_target_aroma_profile_style_target_id_aroma_term_id_pk" PRIMARY KEY("style_target_id","aroma_term_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "style_target_context" (
	"style_target_id" varchar(64) PRIMARY KEY NOT NULL,
	"thermal_band_id" varchar(64),
	"elevation_meters" integer,
	"continentality" "continentality",
	"oak_new_percentage_range" text,
	"oak_type" text,
	"malolactic_conversion" "malolactic_conversion",
	"lees_aging" boolean,
	"whole_cluster" boolean,
	"carbonic_maceration" boolean,
	"skin_contact_white" boolean,
	"aging_vessel" text,
	"aging_potential_years_min" integer,
	"aging_potential_years_max" integer,
	"common_tertiary_aromas" text,
	"structure_evolution_notes" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thermal_band" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"description" text
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
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "region" ADD CONSTRAINT "region_parent_region_id_fkey" FOREIGN KEY ("parent_region_id") REFERENCES "public"."region"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target" ADD CONSTRAINT "style_target_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_grape" ADD CONSTRAINT "style_target_grape_style_target_id_style_target_id_fk" FOREIGN KEY ("style_target_id") REFERENCES "public"."style_target"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_grape" ADD CONSTRAINT "style_target_grape_grape_id_grape_id_fk" FOREIGN KEY ("grape_id") REFERENCES "public"."grape"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_structure" ADD CONSTRAINT "style_target_structure_style_target_id_style_target_id_fk" FOREIGN KEY ("style_target_id") REFERENCES "public"."style_target"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_structure" ADD CONSTRAINT "style_target_structure_structure_dimension_id_structure_dimension_id_fk" FOREIGN KEY ("structure_dimension_id") REFERENCES "public"."structure_dimension"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aroma_term" ADD CONSTRAINT "aroma_term_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."aroma_term"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_aroma_profile" ADD CONSTRAINT "style_target_aroma_profile_style_target_id_style_target_id_fk" FOREIGN KEY ("style_target_id") REFERENCES "public"."style_target"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_aroma_profile" ADD CONSTRAINT "style_target_aroma_profile_aroma_term_id_aroma_term_id_fk" FOREIGN KEY ("aroma_term_id") REFERENCES "public"."aroma_term"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_context" ADD CONSTRAINT "style_target_context_style_target_id_style_target_id_fk" FOREIGN KEY ("style_target_id") REFERENCES "public"."style_target"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_context" ADD CONSTRAINT "style_target_context_thermal_band_id_thermal_band_id_fk" FOREIGN KEY ("thermal_band_id") REFERENCES "public"."thermal_band"("id") ON DELETE set null ON UPDATE no action;
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

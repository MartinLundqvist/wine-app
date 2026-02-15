CREATE TYPE "public"."confusion_set_role" AS ENUM('core', 'distractor');--> statement-breakpoint
CREATE TYPE "public"."data_type" AS ENUM('ordinal', 'categorical');--> statement-breakpoint
CREATE TYPE "public"."descriptor_category" AS ENUM('fruit', 'floral', 'herbal', 'spice', 'earth', 'oak');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard', 'expert');--> statement-breakpoint
CREATE TYPE "public"."exercise_format" AS ENUM('map_place', 'map_recall', 'order_rank', 'descriptor_match', 'structure_deduction', 'elimination', 'skeleton_deduction', 'tasting_input');--> statement-breakpoint
CREATE TYPE "public"."generation_method" AS ENUM('manual', 'distance', 'telemetry');--> statement-breakpoint
CREATE TYPE "public"."mastery_state" AS ENUM('locked', 'in_progress', 'mastered');--> statement-breakpoint
CREATE TYPE "public"."relevance" AS ENUM('primary', 'secondary', 'occasional');--> statement-breakpoint
CREATE TYPE "public"."scale_key" AS ENUM('ordinal_1_5', 'color_intensity_1_3', 'sweetness_1_5');--> statement-breakpoint
CREATE TYPE "public"."wine_color" AS ENUM('red', 'white');--> statement-breakpoint
CREATE TYPE "public"."wine_color_scope" AS ENUM('red', 'white', 'mixed');--> statement-breakpoint
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
	"wine_color" "wine_color_scope" NOT NULL,
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
	"grape_id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"wine_color" "wine_color" NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"canonical_style_target_id" varchar(64) NOT NULL,
	"aliases" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "style_target" (
	"style_target_id" varchar(64) PRIMARY KEY NOT NULL,
	"grape_id" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"wine_color" "wine_color" NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"is_primary_for_grape" boolean NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attribute" (
	"attribute_id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"wine_color_scope" "wine_color_scope" NOT NULL,
	"data_type" "data_type" NOT NULL,
	"scale_key" "scale_key",
	"min_value" integer,
	"max_value" integer,
	"allowed_values" text,
	"description" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "style_target_attribute" (
	"style_target_id" varchar(64) NOT NULL,
	"attribute_id" varchar(64) NOT NULL,
	"value_ordinal" integer,
	"value_categorical" varchar(64),
	"source" varchar(255),
	"confidence" real,
	"notes" text,
	CONSTRAINT "style_target_attribute_style_target_id_attribute_id_pk" PRIMARY KEY("style_target_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "descriptor" (
	"descriptor_id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"category" "descriptor_category" NOT NULL,
	"wine_color_scope" "wine_color_scope" NOT NULL,
	"description" text,
	"intensity_scale_key" varchar(32)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "style_target_descriptor" (
	"style_target_id" varchar(64) NOT NULL,
	"descriptor_id" varchar(64) NOT NULL,
	"relevance" "relevance" NOT NULL,
	"notes" text,
	CONSTRAINT "style_target_descriptor_style_target_id_descriptor_id_pk" PRIMARY KEY("style_target_id","descriptor_id")
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
CREATE TABLE IF NOT EXISTS "confusion_set" (
	"confusion_set_id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"wine_color" "wine_color" NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"rationale" text,
	"generation_method" "generation_method"
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "confusion_set_member" (
	"confusion_set_id" varchar(64) NOT NULL,
	"style_target_id" varchar(64) NOT NULL,
	"role" "confusion_set_role",
	"weight" real,
	CONSTRAINT "confusion_set_member_confusion_set_id_style_target_id_pk" PRIMARY KEY("confusion_set_id","style_target_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bottle_style_match" (
	"bottle_id" varchar(64) NOT NULL,
	"style_target_id" varchar(64) NOT NULL,
	"match_score" real NOT NULL,
	"is_primary_match" boolean NOT NULL,
	"deviation_notes" text,
	"curator" varchar(128),
	CONSTRAINT "bottle_style_match_bottle_id_style_target_id_pk" PRIMARY KEY("bottle_id","style_target_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wine_bottle" (
	"bottle_id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"wine_color" "wine_color" NOT NULL,
	"region" varchar(128),
	"vintage" integer,
	"grapes_label" varchar(255),
	"notes" text,
	"teaching_notes" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target" ADD CONSTRAINT "style_target_grape_id_grape_grape_id_fk" FOREIGN KEY ("grape_id") REFERENCES "public"."grape"("grape_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_attribute" ADD CONSTRAINT "style_target_attribute_style_target_id_style_target_style_target_id_fk" FOREIGN KEY ("style_target_id") REFERENCES "public"."style_target"("style_target_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_attribute" ADD CONSTRAINT "style_target_attribute_attribute_id_attribute_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attribute"("attribute_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_descriptor" ADD CONSTRAINT "style_target_descriptor_style_target_id_style_target_style_target_id_fk" FOREIGN KEY ("style_target_id") REFERENCES "public"."style_target"("style_target_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "style_target_descriptor" ADD CONSTRAINT "style_target_descriptor_descriptor_id_descriptor_descriptor_id_fk" FOREIGN KEY ("descriptor_id") REFERENCES "public"."descriptor"("descriptor_id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "confusion_set_member" ADD CONSTRAINT "confusion_set_member_confusion_set_id_confusion_set_confusion_set_id_fk" FOREIGN KEY ("confusion_set_id") REFERENCES "public"."confusion_set"("confusion_set_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "confusion_set_member" ADD CONSTRAINT "confusion_set_member_style_target_id_style_target_style_target_id_fk" FOREIGN KEY ("style_target_id") REFERENCES "public"."style_target"("style_target_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bottle_style_match" ADD CONSTRAINT "bottle_style_match_bottle_id_wine_bottle_bottle_id_fk" FOREIGN KEY ("bottle_id") REFERENCES "public"."wine_bottle"("bottle_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bottle_style_match" ADD CONSTRAINT "bottle_style_match_style_target_id_style_target_style_target_id_fk" FOREIGN KEY ("style_target_id") REFERENCES "public"."style_target"("style_target_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

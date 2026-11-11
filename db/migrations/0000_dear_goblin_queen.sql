CREATE TYPE "public"."block_type" AS ENUM('hero', 'gallery', 'text', 'video', 'embed', 'tech_stack', 'links', 'divider');--> statement-breakpoint
CREATE TYPE "public"."portfolio_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('Volunteer', 'Publication', 'Leadership');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(100) NOT NULL,
	"password" text,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100),
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" varchar(20) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cloudinary_public_id" varchar(255) NOT NULL,
	"original_name" varchar(255),
	"mime_type" varchar(100),
	"width" integer,
	"height" integer,
	"bytes" integer,
	"format" varchar(20),
	"folder" varchar(100) DEFAULT 'portfolio',
	"tags" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "assets_cloudinary_public_id_unique" UNIQUE("cloudinary_public_id")
);
--> statement-breakpoint
CREATE TABLE "portfolio_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"type" "block_type" NOT NULL,
	"content" jsonb NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(200) NOT NULL,
	"role" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"long_description" text,
	"cover_image_id" uuid,
	"gallery" jsonb DEFAULT '[]'::jsonb,
	"tech_stack" text[] DEFAULT '{}' NOT NULL,
	"highlights" text[] DEFAULT '{}' NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb,
	"is_top_project" boolean DEFAULT false NOT NULL,
	"status" "portfolio_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"seo" jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "portfolios_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"type" "activity_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"organization" varchar(200) NOT NULL,
	"description" text,
	"highlights" text[] DEFAULT '{}',
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "activities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" varchar(180) NOT NULL,
	"title" varchar(200) NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"seo" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"nickname" varchar(50),
	"role" varchar(100) NOT NULL,
	"tagline" varchar(200),
	"bio" text,
	"stats" jsonb DEFAULT '[]'::jsonb,
	"current_focus" jsonb,
	"experience" jsonb DEFAULT '[]'::jsonb,
	"education" jsonb DEFAULT '[]'::jsonb,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"how_i_build" jsonb,
	"seo" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_blocks" ADD CONSTRAINT "portfolio_blocks_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_cover_image_id_assets_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_idx" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verifications_expires_at_idx" ON "verifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "assets_folder_idx" ON "assets" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "assets_created_at_idx" ON "assets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "assets_deleted_at_idx" ON "assets" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "portfolio_blocks_portfolio_id_idx" ON "portfolio_blocks" USING btree ("portfolio_id");--> statement-breakpoint
CREATE INDEX "portfolio_blocks_order_idx" ON "portfolio_blocks" USING btree ("portfolio_id","order");--> statement-breakpoint
CREATE INDEX "portfolios_status_idx" ON "portfolios" USING btree ("status");--> statement-breakpoint
CREATE INDEX "portfolios_slug_idx" ON "portfolios" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "portfolios_order_idx" ON "portfolios" USING btree ("order");--> statement-breakpoint
CREATE INDEX "portfolios_deleted_at_idx" ON "portfolios" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "activities_type_idx" ON "activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "activities_order_idx" ON "activities" USING btree ("order");--> statement-breakpoint
CREATE INDEX "pages_path_idx" ON "pages" USING btree ("path");
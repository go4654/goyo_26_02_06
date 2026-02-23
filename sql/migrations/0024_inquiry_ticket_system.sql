CREATE TYPE "public"."inquiry_author_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."inquiry_category" AS ENUM('general', 'class', 'gallery', 'account', 'etc');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('pending', 'answered', 'closed');--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" "inquiry_category" DEFAULT 'general' NOT NULL,
	"status" "inquiry_status" DEFAULT 'pending' NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiry_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"author_profile_id" uuid NOT NULL,
	"author_role" "inquiry_author_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_messages" ADD CONSTRAINT "inquiry_messages_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_messages" ADD CONSTRAINT "inquiry_messages_author_profile_id_profiles_profile_id_fk" FOREIGN KEY ("author_profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inquiries_profile_id_created_at_idx" ON "inquiries" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "inquiries_status_last_activity_at_idx" ON "inquiries" USING btree ("status","last_activity_at");--> statement-breakpoint
CREATE INDEX "inquiry_messages_inquiry_id_created_at_idx" ON "inquiry_messages" USING btree ("inquiry_id","created_at");
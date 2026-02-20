ALTER TABLE "news" ADD COLUMN "thumbnail_image_url" text;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "cover_image_urls" text[] DEFAULT '{}'::text[] NOT NULL;
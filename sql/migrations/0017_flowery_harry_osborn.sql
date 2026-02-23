DO $$ BEGIN
  CREATE TYPE "public"."news_category" AS ENUM('notice', 'update', 'news');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "news" ALTER COLUMN "category" DROP DEFAULT;
  ALTER TABLE "news" ALTER COLUMN "category" SET DATA TYPE "news_category" USING category::"news_category";
  ALTER TABLE "news" ALTER COLUMN "category" SET DEFAULT 'notice'::"news_category";
EXCEPTION
  WHEN others THEN
    -- If already migrated, skip
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'news_category') THEN
      RAISE;
    END IF;
END $$;
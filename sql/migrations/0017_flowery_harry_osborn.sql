CREATE TYPE "public"."news_category" AS ENUM('notice', 'update', 'news');--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "category" SET DATA TYPE news_category;
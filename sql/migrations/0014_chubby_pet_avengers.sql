CREATE TABLE "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'notice' NOT NULL,
	"slug" text NOT NULL,
	"content_mdx" text NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"author_id" uuid,
	"published_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "news_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "news" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_profiles_profile_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("profile_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "news_slug_idx" ON "news" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "news_category_idx" ON "news" USING btree ("category");--> statement-breakpoint
CREATE INDEX "news_published_idx" ON "news" USING btree ("is_published");--> statement-breakpoint
CREATE POLICY "select-news" ON "news" AS PERMISSIVE FOR SELECT TO public USING (
        "news"."is_published" = true
        AND (
          "news"."visibility" = 'public'
          OR (
            "news"."visibility" = 'member'
            AND (select auth.uid()) IS NOT NULL
          )
        )
      );--> statement-breakpoint
CREATE POLICY "admin-insert-news" ON "news" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = (select auth.uid())
          AND p.role = 'admin'
        )
      );--> statement-breakpoint
CREATE POLICY "admin-update-news" ON "news" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = (select auth.uid())
          AND p.role = 'admin'
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = (select auth.uid())
          AND p.role = 'admin'
        )
      );--> statement-breakpoint
CREATE POLICY "admin-delete-news" ON "news" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = (select auth.uid())
          AND p.role = 'admin'
        )
      );
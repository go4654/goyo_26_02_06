CREATE TABLE "news_view_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"news_id" uuid NOT NULL,
	"user_id" uuid,
	"anon_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news_view_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "news_view_events" ADD CONSTRAINT "news_view_events_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_view_events" ADD CONSTRAINT "news_view_events_user_id_profiles_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("profile_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "news_view_events_news_id_idx" ON "news_view_events" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "news_view_events_user_id_idx" ON "news_view_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "news_view_events_created_at_idx" ON "news_view_events" USING btree ("created_at");--> statement-breakpoint
CREATE POLICY "select-news-view-events-admin-only" ON "news_view_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.profile_id = (select auth.uid())
            AND p.role = 'admin'
          )
        );--> statement-breakpoint
CREATE POLICY "insert-news-view-events-auth" ON "news_view_events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
          "news_view_events"."user_id" = (select auth.uid())
        );--> statement-breakpoint
CREATE POLICY "insert-news-view-events-anon" ON "news_view_events" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);
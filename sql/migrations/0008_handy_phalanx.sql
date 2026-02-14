CREATE TABLE "galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"caption" text,
	"thumbnail_image_url" text,
	"image_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"slug" text NOT NULL,
	"author_id" uuid,
	"is_published" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"save_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "galleries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "galleries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "gallery_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gallery_likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "gallery_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gallery_saves" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_author_id_profiles_profile_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("profile_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_likes" ADD CONSTRAINT "gallery_likes_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_likes" ADD CONSTRAINT "gallery_likes_user_id_profiles_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_saves" ADD CONSTRAINT "gallery_saves_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_saves" ADD CONSTRAINT "gallery_saves_user_id_profiles_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "galleries_slug_idx" ON "galleries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "galleries_published_idx" ON "galleries" USING btree ("is_published");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_likes_unique_user_gallery" ON "gallery_likes" USING btree ("user_id","gallery_id");--> statement-breakpoint
CREATE INDEX "gallery_likes_gallery_id_idx" ON "gallery_likes" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "gallery_likes_user_id_idx" ON "gallery_likes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_saves_unique_user_gallery" ON "gallery_saves" USING btree ("user_id","gallery_id");--> statement-breakpoint
CREATE INDEX "gallery_saves_gallery_id_idx" ON "gallery_saves" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "gallery_saves_user_id_idx" ON "gallery_saves" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "select-gallery" ON "galleries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
          "galleries"."is_published" = true
          AND EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.profile_id = (select auth.uid())
            AND (p.gallery_access = true OR p.role = 'admin')
          )
        );--> statement-breakpoint
CREATE POLICY "admin-insert-gallery" ON "galleries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = (select auth.uid())
          AND p.role = 'admin'
        )
      );--> statement-breakpoint
CREATE POLICY "admin-update-gallery" ON "galleries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
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
CREATE POLICY "admin-delete-gallery" ON "galleries" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = (select auth.uid())
          AND p.role = 'admin'
        )
      );--> statement-breakpoint
CREATE POLICY "select-gallery-likes" ON "gallery_likes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("gallery_likes"."user_id" = (select auth.uid()) OR public.is_admin());--> statement-breakpoint
CREATE POLICY "insert-gallery-likes" ON "gallery_likes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("gallery_likes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "delete-gallery-likes" ON "gallery_likes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("gallery_likes"."user_id" = (select auth.uid()) OR public.is_admin());--> statement-breakpoint
CREATE POLICY "select-gallery-saves" ON "gallery_saves" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("gallery_saves"."user_id" = (select auth.uid()) OR public.is_admin());--> statement-breakpoint
CREATE POLICY "insert-gallery-saves" ON "gallery_saves" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("gallery_saves"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "delete-gallery-saves" ON "gallery_saves" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("gallery_saves"."user_id" = (select auth.uid()) OR public.is_admin());
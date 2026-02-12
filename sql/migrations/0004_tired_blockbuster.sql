CREATE TABLE "class_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"content" text NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "class_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "class_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_saves" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "class_view_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"user_id" uuid,
	"anon_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_view_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"slug" text NOT NULL,
	"thumbnail_image_url" text,
	"cover_image_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"content_mdx" text NOT NULL,
	"author_id" uuid NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"save_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "classes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "comment_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comment_likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "class_comments" ADD CONSTRAINT "class_comments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_comments" ADD CONSTRAINT "class_comments_user_id_profiles_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_comments" ADD CONSTRAINT "class_comments_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."class_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_likes" ADD CONSTRAINT "class_likes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_likes" ADD CONSTRAINT "class_likes_user_id_profiles_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_saves" ADD CONSTRAINT "class_saves_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_saves" ADD CONSTRAINT "class_saves_user_id_profiles_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_view_events" ADD CONSTRAINT "class_view_events_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_view_events" ADD CONSTRAINT "class_view_events_user_id_profiles_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("profile_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_author_id_profiles_profile_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("profile_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_class_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."class_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_profiles_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "class_comments_class_id_idx" ON "class_comments" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "class_comments_parent_id_idx" ON "class_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "class_comments_user_id_idx" ON "class_comments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "class_likes_unique_user_class" ON "class_likes" USING btree ("user_id","class_id");--> statement-breakpoint
CREATE INDEX "class_likes_class_id_idx" ON "class_likes" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "class_likes_user_id_idx" ON "class_likes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "class_saves_unique_user_class" ON "class_saves" USING btree ("user_id","class_id");--> statement-breakpoint
CREATE INDEX "class_saves_class_id_idx" ON "class_saves" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "class_saves_user_id_idx" ON "class_saves" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "class_view_events_class_id_idx" ON "class_view_events" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "class_view_events_user_id_idx" ON "class_view_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "class_view_events_created_at_idx" ON "class_view_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "classes_slug_idx" ON "classes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "classes_category_idx" ON "classes" USING btree ("category");--> statement-breakpoint
CREATE INDEX "classes_not_deleted_idx" ON "classes" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX "classes_published_idx" ON "classes" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "classes_public_idx" ON "classes" USING btree ("is_deleted","is_published");--> statement-breakpoint
CREATE INDEX "classes_category_public_idx" ON "classes" USING btree ("category","is_deleted","is_published");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_likes_unique_user_comment" ON "comment_likes" USING btree ("user_id","comment_id");--> statement-breakpoint
CREATE INDEX "comment_likes_comment_id_idx" ON "comment_likes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "comment_likes_user_id_idx" ON "comment_likes" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "select-class-comments" ON "class_comments" AS PERMISSIVE FOR SELECT TO public USING (
          "class_comments"."is_deleted" = false
          AND EXISTS (
            SELECT 1
            FROM classes c
            WHERE c.id = "class_comments"."class_id"
            AND c.is_deleted = false
            AND (
              c.is_published = true
              OR (
                (select auth.uid()) IS NOT NULL
                AND EXISTS (
                  SELECT 1 FROM profiles p
                  WHERE p.profile_id = (select auth.uid())
                  AND p.role = 'admin'
                )
              )
            )
          )
        );--> statement-breakpoint
CREATE POLICY "insert-class-comments" ON "class_comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
          "class_comments"."user_id" = (select auth.uid())
          AND EXISTS (
            SELECT 1
            FROM classes c
            WHERE c.id = "class_comments"."class_id"
            AND c.is_deleted = false
            AND c.is_published = true
          )
        );--> statement-breakpoint
CREATE POLICY "update-class-comments" ON "class_comments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
          "class_comments"."user_id" = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.profile_id = (select auth.uid())
            AND p.role = 'admin'
          )
        ) WITH CHECK (
          "class_comments"."user_id" = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.profile_id = (select auth.uid())
            AND p.role = 'admin'
          )
        );--> statement-breakpoint
CREATE POLICY "delete-class-comments" ON "class_comments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
          "class_comments"."user_id" = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.profile_id = (select auth.uid())
            AND p.role = 'admin'
          )
        );--> statement-breakpoint
CREATE POLICY "select-class-likes" ON "class_likes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        "class_likes"."user_id" = (select auth.uid())
        OR public.is_admin()
      );--> statement-breakpoint
CREATE POLICY "insert-class-likes" ON "class_likes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("class_likes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "delete-class-likes" ON "class_likes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("class_likes"."user_id" = (select auth.uid()) OR public.is_admin());--> statement-breakpoint
CREATE POLICY "select-class-saves" ON "class_saves" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("class_saves"."user_id" = (select auth.uid()) OR public.is_admin());--> statement-breakpoint
CREATE POLICY "insert-class-saves" ON "class_saves" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("class_saves"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "delete-class-saves" ON "class_saves" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("class_saves"."user_id" = (select auth.uid()) OR public.is_admin());--> statement-breakpoint
CREATE POLICY "select-class-view-events-admin-only" ON "class_view_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());--> statement-breakpoint
CREATE POLICY "insert-class-view-events-auth" ON "class_view_events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("class_view_events"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "insert-class-view-events-anon" ON "class_view_events" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK ("class_view_events"."user_id" IS NULL);--> statement-breakpoint
CREATE POLICY "select-class" ON "classes" AS PERMISSIVE FOR SELECT TO public USING (
    "classes"."is_deleted" = false
    AND (
      "classes"."is_published" = true
      OR (
        (select auth.uid()) IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM profiles p
          WHERE p.profile_id = (select auth.uid())
          AND p.role = 'admin'
        )
      )
    )
  );--> statement-breakpoint
CREATE POLICY "admin-insert-class" ON "classes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.profile_id = (select auth.uid())
      AND p.role = 'admin'
    )
  );--> statement-breakpoint
CREATE POLICY "admin-update-class" ON "classes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.profile_id = (select auth.uid())
      AND p.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.profile_id = (select auth.uid())
      AND p.role = 'admin'
    )
  );--> statement-breakpoint
CREATE POLICY "admin-delete-class" ON "classes" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.profile_id = (select auth.uid())
      AND p.role = 'admin'
    )
  );--> statement-breakpoint
CREATE POLICY "select-comment-likes" ON "comment_likes" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "insert-comment-likes" ON "comment_likes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("comment_likes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "delete-comment-likes" ON "comment_likes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("comment_likes"."user_id" = (select auth.uid()) OR public.is_admin());
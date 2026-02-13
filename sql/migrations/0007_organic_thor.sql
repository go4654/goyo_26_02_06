CREATE TABLE "class_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "class_tags" ADD CONSTRAINT "class_tags_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_tags" ADD CONSTRAINT "class_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "class_tags_unique" ON "class_tags" USING btree ("class_id","tag_id");--> statement-breakpoint
CREATE INDEX "class_tags_class_id_idx" ON "class_tags" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "class_tags_tag_id_idx" ON "class_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_unique" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE POLICY "select-class-tags" ON "class_tags" AS PERMISSIVE FOR SELECT TO public USING (
        EXISTS (
          SELECT 1 FROM classes c
          WHERE c.id = "class_tags"."class_id"
          AND c.is_deleted = false
          AND (
            c.is_published = true
            OR EXISTS (
              SELECT 1 FROM profiles p
              WHERE p.profile_id = (select auth.uid())
              AND p.role = 'admin'
            )
          )
        )
      );--> statement-breakpoint
CREATE POLICY "insert-class-tags-admin" ON "class_tags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = (select auth.uid())
          AND p.role = 'admin'
        )
      );--> statement-breakpoint
CREATE POLICY "delete-class-tags-admin" ON "class_tags" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = (select auth.uid())
          AND p.role = 'admin'
        )
      );--> statement-breakpoint
CREATE POLICY "select-tags" ON "tags" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "insert-tags-admin-only" ON "tags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = (select auth.uid())
          AND p.role = 'admin'
        )
      );--> statement-breakpoint
CREATE POLICY "update-tags-admin-only" ON "tags" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
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
CREATE POLICY "delete-tags-admin-only" ON "tags" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = (select auth.uid())
          AND p.role = 'admin'
        )
      );
CREATE TABLE "gallery_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gallery_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gallery_tags" ADD CONSTRAINT "gallery_tags_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_tags" ADD CONSTRAINT "gallery_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_tags_unique" ON "gallery_tags" USING btree ("gallery_id","tag_id");--> statement-breakpoint
CREATE INDEX "gallery_tags_gallery_id_idx" ON "gallery_tags" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "gallery_tags_tag_id_idx" ON "gallery_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE POLICY "select-gallery-tags" ON "gallery_tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
          EXISTS (
            SELECT 1 FROM galleries g
            WHERE g.id = "gallery_tags"."gallery_id"
            AND g.is_published = true
          )
        );--> statement-breakpoint
CREATE POLICY "insert-gallery-tags" ON "gallery_tags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.is_admin());--> statement-breakpoint
CREATE POLICY "delete-gallery-tags" ON "gallery_tags" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.is_admin());
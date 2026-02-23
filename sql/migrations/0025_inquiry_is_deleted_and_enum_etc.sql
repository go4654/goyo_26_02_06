ALTER TABLE "inquiries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "inquiry_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP INDEX IF EXISTS "inquiries_profile_id_created_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "inquiries_status_last_activity_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "inquiry_messages_inquiry_id_created_at_idx";--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiries_profile_idx" ON "inquiries" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiries_status_idx" ON "inquiries" USING btree ("status","last_activity_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiries_not_deleted_idx" ON "inquiries" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiries_profile_not_deleted_idx" ON "inquiries" USING btree ("profile_id","is_deleted","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiry_messages_idx" ON "inquiry_messages" USING btree ("inquiry_id","created_at");--> statement-breakpoint
DROP POLICY IF EXISTS "select-own-inquiry" ON "inquiries";--> statement-breakpoint
CREATE POLICY "select-own-inquiry" ON "inquiries" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("inquiries"."profile_id" = (select auth.uid()) AND "inquiries"."is_deleted" = false);--> statement-breakpoint
DROP POLICY IF EXISTS "select-inquiry-admin" ON "inquiries";--> statement-breakpoint
CREATE POLICY "select-inquiry-admin" ON "inquiries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());--> statement-breakpoint
DROP POLICY IF EXISTS "insert-own-inquiry" ON "inquiries";--> statement-breakpoint
CREATE POLICY "insert-own-inquiry" ON "inquiries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("inquiries"."profile_id" = (select auth.uid()));--> statement-breakpoint
DROP POLICY IF EXISTS "update-own-inquiry" ON "inquiries";--> statement-breakpoint
CREATE POLICY "update-own-inquiry" ON "inquiries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("inquiries"."profile_id" = (select auth.uid())) WITH CHECK ("inquiries"."profile_id" = (select auth.uid()));--> statement-breakpoint
DROP POLICY IF EXISTS "admin-update-inquiry" ON "inquiries";--> statement-breakpoint
CREATE POLICY "admin-update-inquiry" ON "inquiries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.is_admin()) WITH CHECK (public.is_admin());--> statement-breakpoint
DROP POLICY IF EXISTS "admin-delete-inquiry" ON "inquiries";--> statement-breakpoint
CREATE POLICY "admin-delete-inquiry" ON "inquiries" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.is_admin());--> statement-breakpoint
DROP POLICY IF EXISTS "select-own-inquiry-messages" ON "inquiry_messages";--> statement-breakpoint
CREATE POLICY "select-own-inquiry-messages" ON "inquiry_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
          EXISTS (
            SELECT 1
            FROM inquiries i
            WHERE i.id = "inquiry_messages"."inquiry_id"
            AND i.profile_id = (select auth.uid())
            AND i.is_deleted = false
          )
        );--> statement-breakpoint
DROP POLICY IF EXISTS "select-inquiry-messages-admin" ON "inquiry_messages";--> statement-breakpoint
CREATE POLICY "select-inquiry-messages-admin" ON "inquiry_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());--> statement-breakpoint
DROP POLICY IF EXISTS "insert-own-inquiry-message" ON "inquiry_messages";--> statement-breakpoint
CREATE POLICY "insert-own-inquiry-message" ON "inquiry_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("inquiry_messages"."author_profile_id" = (select auth.uid()));--> statement-breakpoint
DROP POLICY IF EXISTS "admin-delete-inquiry-message" ON "inquiry_messages";--> statement-breakpoint
CREATE POLICY "admin-delete-inquiry-message" ON "inquiry_messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.is_admin());
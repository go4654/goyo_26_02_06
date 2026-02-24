CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"singleton_key" text DEFAULT 'global' NOT NULL,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"signup_enabled" boolean DEFAULT true NOT NULL,
	"notice_enabled" boolean DEFAULT false NOT NULL,
	"notice_message" text,
	"notice_variant" text DEFAULT 'info' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton_key_unique" UNIQUE("singleton_key"),
	CONSTRAINT "site_settings_notice_variant_check" CHECK ("site_settings"."notice_variant" IN ('info', 'warning', 'event'))
);
--> statement-breakpoint
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "select-site-settings" ON "site_settings" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("site_settings"."singleton_key" = 'global');--> statement-breakpoint
CREATE POLICY "admin-update-site-settings" ON "site_settings" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.profile_id = (select auth.uid())
  AND p.role = 'admin'
)) WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.profile_id = (select auth.uid())
  AND p.role = 'admin'
));--> statement-breakpoint
CREATE POLICY "admin-insert-site-settings" ON "site_settings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.profile_id = (select auth.uid())
  AND p.role = 'admin'
));--> statement-breakpoint
CREATE POLICY "admin-delete-site-settings" ON "site_settings" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.profile_id = (select auth.uid())
  AND p.role = 'admin'
));--> statement-breakpoint
-- 싱글톤 초기 행: 이미 존재하면 스킵 (idempotent)
INSERT INTO "site_settings" ("singleton_key")
VALUES ('global')
ON CONFLICT ("singleton_key") DO NOTHING;
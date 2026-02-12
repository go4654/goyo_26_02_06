ALTER TABLE "profiles" ADD COLUMN "gallery_access" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "last_active_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_blocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "blocked_reason" text;--> statement-breakpoint
DROP POLICY IF EXISTS "edit-profile-policy" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "delete-profile-policy" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "select-profile-policy" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "user-update-own-profile" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "admin-update-all-profiles" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "select-profile" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "delete-profile" ON "profiles" CASCADE;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profile_id = auth.uid()
    AND role = 'admin'
  );
$$;--> statement-breakpoint
CREATE POLICY "user-update-own-profile" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
        (select auth.uid()) = "profiles"."profile_id"
        AND NOT public.is_admin()
      ) WITH CHECK (
        (select auth.uid()) = "profiles"."profile_id"
      );--> statement-breakpoint
CREATE POLICY "admin-update-all-profiles" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
        public.is_admin()
      ) WITH CHECK (
        public.is_admin()
      );--> statement-breakpoint
CREATE POLICY "select-profile" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        (select auth.uid()) = "profiles"."profile_id"
        OR public.is_admin()
      );--> statement-breakpoint
CREATE POLICY "delete-profile" ON "profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
        (select auth.uid()) = "profiles"."profile_id"
        OR public.is_admin()
      );
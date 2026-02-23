DO $$ BEGIN
  CREATE POLICY "select-gallery-admin" ON "galleries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER POLICY "admin-insert-gallery" ON "galleries" TO authenticated WITH CHECK (public.is_admin());--> statement-breakpoint
ALTER POLICY "admin-update-gallery" ON "galleries" TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());--> statement-breakpoint
ALTER POLICY "admin-delete-gallery" ON "galleries" TO authenticated USING (public.is_admin());
ALTER POLICY "admin-insert-news" ON "news" TO authenticated WITH CHECK (public.is_admin());--> statement-breakpoint
ALTER POLICY "admin-update-news" ON "news" TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());--> statement-breakpoint
ALTER POLICY "admin-delete-news" ON "news" TO authenticated USING (public.is_admin());
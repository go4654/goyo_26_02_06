DO $$ BEGIN
  CREATE POLICY "select-news-admin" ON "news" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
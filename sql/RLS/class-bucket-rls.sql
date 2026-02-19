-- 기존 정책 제거 (있으면)
DROP POLICY IF EXISTS "class upload admin only" ON storage.objects;

-- 관리자만 업로드 허용
CREATE POLICY "class upload admin only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'class'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.profile_id = auth.uid()
    AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "class public read" ON storage.objects;

CREATE POLICY "class public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'class');
-- 갤러리 버킷 RLS 정책
-- - SELECT: 로그인한 유저 중 gallery_access = true 또는 admin만 조회 가능
-- - INSERT / UPDATE / DELETE: 관리자만 가능

-- 기존 정책 제거 (있으면)
DROP POLICY IF EXISTS "gallery select authenticated gallery access" ON storage.objects;
DROP POLICY IF EXISTS "gallery insert admin only" ON storage.objects;
DROP POLICY IF EXISTS "gallery update admin only" ON storage.objects;
DROP POLICY IF EXISTS "gallery delete admin only" ON storage.objects;

-- 조회: 로그인 유저 + gallery_access 허용 또는 관리자만
CREATE POLICY "gallery select authenticated gallery access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'gallery'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.profile_id = auth.uid()
    AND (p.gallery_access = true OR p.role = 'admin')
  )
);

-- 등록: 관리자만
CREATE POLICY "gallery insert admin only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery'
  AND public.is_admin()
);

-- 수정: 관리자만
CREATE POLICY "gallery update admin only"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'gallery' AND public.is_admin())
WITH CHECK (bucket_id = 'gallery' AND public.is_admin());

-- 삭제: 관리자만
CREATE POLICY "gallery delete admin only"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'gallery' AND public.is_admin());

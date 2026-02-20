-- ===============================
-- NEWS BUCKET POLICY
-- ===============================
-- - SELECT: 로그인한 유저만 뉴스 이미지 조회 가능
-- - INSERT / UPDATE / DELETE: 관리자만 가능

-- 1) 기존 정책 제거
DROP POLICY IF EXISTS "news public read" ON storage.objects;
DROP POLICY IF EXISTS "news select authenticated only" ON storage.objects;
DROP POLICY IF EXISTS "news upload admin only" ON storage.objects;
DROP POLICY IF EXISTS "news update admin only" ON storage.objects;
DROP POLICY IF EXISTS "news delete admin only" ON storage.objects;

-- 2) 조회: 로그인한 유저만 허용 (비로그인 불가)
CREATE POLICY "news select authenticated only"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'news');

-- 3) 등록: 관리자만
CREATE POLICY "news upload admin only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'news'
  AND public.is_admin()
);

-- 4) 수정: 관리자만
CREATE POLICY "news update admin only"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'news' AND public.is_admin())
WITH CHECK (bucket_id = 'news' AND public.is_admin());

-- 5) 삭제: 관리자만
CREATE POLICY "news delete admin only"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'news' AND public.is_admin());

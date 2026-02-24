-- ===============================
-- AVATARS BUCKET POLICY (프로필 이미지)
-- ===============================
-- - SELECT: 공개 읽기 (프로필 이미지 URL 노출용)
-- - INSERT / UPDATE / DELETE: 인증된 사용자가 자신의 경로(user_id/...)에만 가능

-- 1) 기존 정책 제거
DROP POLICY IF EXISTS "avatars select public read" ON storage.objects;
DROP POLICY IF EXISTS "avatars insert own only" ON storage.objects;
DROP POLICY IF EXISTS "avatars update own only" ON storage.objects;
DROP POLICY IF EXISTS "avatars delete own only" ON storage.objects;

-- 2) 조회: 공개 (비로그인 포함 프로필 이미지 표시)
CREATE POLICY "avatars select public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 3) 등록: 인증된 사용자만 자신의 경로(이름의 첫 세그먼트 = auth.uid())에 업로드
CREATE POLICY "avatars insert own only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4) 수정: 본인 객체만 수정 가능
CREATE POLICY "avatars update own only"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5) 삭제: 본인 객체만 삭제 가능 (계정 삭제 시 cleanup은 service role로 RLS 우회)
CREATE POLICY "avatars delete own only"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- RLS 무한 재귀 문제 해결 스크립트
-- ============================================================================
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요.

-- 1. 기존의 문제가 있는 정책들 모두 삭제
DROP POLICY IF EXISTS "edit-profile-policy" ON public.profiles;
DROP POLICY IF EXISTS "delete-profile-policy" ON public.profiles;
DROP POLICY IF EXISTS "select-profile-policy" ON public.profiles;

-- 2. 헬퍼 함수 생성 (SECURITY DEFINER로 RLS 우회)
-- 현재 로그인한 사용자가 관리자인지 확인하는 함수
-- 보안: 매개변수 없이 auth.uid()만 사용하여 다른 사용자 조회 불가능
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
$$;

-- 3. 새로운 RLS 정책 생성 (헬퍼 함수 사용으로 무한 재귀 방지)

-- SELECT: 자신의 프로필은 항상 조회 가능, 관리자는 모든 프로필 조회 가능
CREATE POLICY "select-profile-policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- 자신의 프로필은 항상 조회 가능
  auth.uid() = profile_id
  OR 
  -- 관리자는 모든 프로필 조회 가능 (헬퍼 함수로 RLS 순환 참조 방지)
  public.is_admin()
);

-- UPDATE: 자신의 프로필은 수정 가능, 관리자는 모든 프로필 수정 가능
-- 단, 일반 사용자는 role 컬럼을 수정할 수 없음
CREATE POLICY "edit-profile-policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = profile_id
  OR
  public.is_admin()
)
WITH CHECK (
  -- 관리자는 모든 것 수정 가능
  public.is_admin()
  OR
  -- 일반 사용자는 자신의 프로필만 수정 가능하며 role 변경 불가
  (
    auth.uid() = profile_id 
    AND role = (SELECT role FROM public.profiles WHERE profile_id = auth.uid())
  )
);

-- DELETE: 자신의 프로필은 삭제 가능, 관리자는 모든 프로필 삭제 가능
CREATE POLICY "delete-profile-policy"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  auth.uid() = profile_id
  OR
  public.is_admin()
);

-- 4. 검증
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- 5. 관리자 권한 부여 (본인 이메일로 변경)
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE profile_id = (
--   SELECT id FROM auth.users
--   WHERE email = 'your-email@example.com'
-- );

-- 6. 권한 확인
-- SELECT 
--   p.profile_id,
--   p.name,
--   p.role,
--   u.email
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.profile_id;

-- 7. 현재 사용자가 관리자인지 확인
-- SELECT public.is_admin();

-- ============================================================================
-- RLS 정책 및 role 컬럼 적용 확인 스크립트
-- ============================================================================
-- 이 스크립트는 마이그레이션이 올바르게 적용되었는지 확인합니다.
-- Supabase SQL Editor에서 실행하세요.

-- 1. profiles 테이블에 role 컬럼이 추가되었는지 확인
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'role';
-- 예상 결과: role | text | 'user'::text | NO

-- 2. 현재 모든 프로필의 role 값 확인
SELECT 
  p.profile_id,
  p.name,
  p.role,
  u.email,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.profile_id
ORDER BY p.created_at DESC;
-- 예상: 모든 사용자의 role이 'user'로 설정되어 있어야 함

-- 3. profiles 테이블의 RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;
-- 예상 정책:
-- - delete-profile-policy (DELETE)
-- - edit-profile-policy (UPDATE)
-- - insert-profile-policy (INSERT)
-- - select-profile-policy (SELECT)

-- 4. handle_sign_up 트리거 함수 확인
SELECT prosrc
FROM pg_proc
WHERE proname = 'handle_sign_up';
-- 예상: role 컬럼에 'user' 값을 삽입하는 코드가 포함되어야 함

-- 5. is_admin() 헬퍼 함수 확인 (보안 강화)
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proargtypes::regtype[] as argument_types
FROM pg_proc
WHERE proname = 'is_admin';
-- 예상: is_security_definer = true, argument_types = {} (매개변수 없음)

-- 6. 테스트: 자신의 프로필 조회 (현재 로그인한 사용자의 프로필만 조회 가능)
SELECT profile_id, name, role, created_at
FROM public.profiles
WHERE profile_id = auth.uid();
-- 예상: 자신의 프로필 정보가 조회되어야 함

-- 7. 보안 테스트: is_admin() 함수 (현재 사용자 기준)
SELECT public.is_admin() as am_i_admin;
-- 예상: 관리자면 true, 아니면 false

-- ============================================================================
-- 관리자 권한 부여 (필요한 경우)
-- ============================================================================
-- 아래 이메일을 본인의 이메일로 변경하세요

-- 관리자 권한 부여
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE profile_id = (
--   SELECT id FROM auth.users
--   WHERE email = 'your-email@example.com'
-- );

-- 권한 부여 확인
-- SELECT 
--   p.profile_id,
--   p.name,
--   p.role,
--   u.email,
--   p.created_at
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.profile_id
-- WHERE p.role = 'admin';

-- 현재 사용자가 관리자인지 확인
-- SELECT public.is_admin();

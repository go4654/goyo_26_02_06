/**
 * 관리자 기능 테스트 및 설정 SQL
 * 
 * 이 파일은 Supabase SQL Editor에서 실행하여 관리자 기능을 테스트합니다.
 */

-- ============================================================================
-- 1. 현재 상태 확인
-- ============================================================================

-- profiles 테이블 구조 확인
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 모든 사용자의 role 확인
SELECT profile_id, name, role, created_at
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================================================
-- 2. 관리자 계정 생성/변경
-- ============================================================================

-- 특정 사용자를 관리자로 변경 (이메일로 찾기)
-- ⚠️ 'your-email@example.com'을 실제 이메일로 변경하세요
UPDATE public.profiles
SET role = 'admin'
WHERE profile_id = (
  SELECT id FROM auth.users
  WHERE email = 'your-email@example.com'
);

-- 특정 사용자를 관리자로 변경 (ID로 직접 지정)
-- ⚠️ 'user-id-here'를 실제 사용자 ID로 변경하세요
UPDATE public.profiles
SET role = 'admin'
WHERE profile_id = 'user-id-here';

-- ============================================================================
-- 3. 관리자 계정 확인
-- ============================================================================

-- 관리자 목록 확인
SELECT 
  p.profile_id,
  p.name,
  p.role,
  u.email,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.profile_id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;

-- ============================================================================
-- 4. RLS 정책 테스트
-- ============================================================================

-- 현재 RLS 정책 확인
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
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- 5. 관리자 계정을 일반 사용자로 되돌리기
-- ============================================================================

-- 특정 사용자를 일반 사용자로 변경 (이메일로 찾기)
-- UPDATE public.profiles
-- SET role = 'user'
-- WHERE profile_id = (
--   SELECT id FROM auth.users
--   WHERE email = 'your-email@example.com'
-- );

-- ============================================================================
-- 6. 인덱스 확인 (성능)
-- ============================================================================

-- profiles 테이블의 인덱스 확인
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
ORDER BY indexname;

-- ============================================================================
-- 7. 통계 확인
-- ============================================================================

-- 전체 사용자 수
SELECT COUNT(*) as total_users FROM public.profiles;

-- role별 사용자 수
SELECT role, COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;

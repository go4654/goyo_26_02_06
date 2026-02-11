/**
 * Database Migration: 0002_add_role_and_admin_support
 * 
 * 이 마이그레이션은 관리자 기능을 추가합니다:
 * 1. profiles 테이블에 role 컬럼 추가 (기본값: 'user')
 * 2. role 컬럼에 인덱스 추가 (성능 향상)
 * 
 * 주의: 복잡한 RLS 정책과 함수는 Drizzle이 파싱할 수 없으므로
 * sql/fix-rls-recursion.sql을 Supabase SQL Editor에서 직접 실행하세요.
 */

-- ============================================================================
-- 1. role 컬럼 추가
-- ============================================================================

-- profiles 테이블에 role 컬럼 추가
DO $migration$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN role text NOT NULL DEFAULT 'user';
    END IF;
END $migration$;

-- 기존 프로필에 'user' role 설정
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL OR role = '';

-- role 컬럼에 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================================
-- 2. RLS 정책 및 헬퍼 함수
-- ============================================================================

/**
 * 아래 내용은 Drizzle이 파싱할 수 없는 복잡한 SQL 함수와 정책입니다.
 * sql/fix-rls-recursion.sql 파일을 Supabase SQL Editor에서 직접 실행하세요.
 * 
 * 포함 내용:
 * - handle_sign_up 트리거 함수 업데이트 (role 포함)
 * - is_admin() 헬퍼 함수 생성 (SECURITY DEFINER로 RLS 우회, 보안 강화)
 * - RLS 정책 업데이트 (무한 재귀 방지)
 * 
 * 보안 참고:
 * - is_admin() 함수는 매개변수를 받지 않고 auth.uid()만 사용
 * - 클라이언트에서 다른 사용자의 role 조회 불가능
 */

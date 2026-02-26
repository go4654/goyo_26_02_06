-- =============================================================================
-- public_profiles VIEW
-- 댓글/클래스/갤러리 등에서 작성자 공개 정보만 노출하기 위한 뷰
--
-- 요약:
-- - profiles 테이블 RLS는 변경하지 않음 (본인/관리자만 profiles 직접 조회)
-- - 공개용 최소 필드만 제공: profile_id, name, avatar_url
-- - VIEW는 security_invoker = false(기본)로 definer 권한 실행 → 뷰 소유자가 profiles 읽음
-- - GRANT로 authenticated만 뷰 SELECT 허용 → 로그인 유저는 뷰를 통해 모든 행의 공개 필드만 조회
--
-- 충돌 검토:
-- - profiles에 대한 기존 RLS 정책은 그대로 적용됨 (뷰가 profiles를 읽을 때는 뷰 소유자로 실행)
-- - public_profiles 뷰에는 RLS를 걸지 않음 (뷰 자체에 GRANT만으로 접근 제어)
--
-- Supabase SQL Editor에서 실행
-- =============================================================================

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = false)
AS
SELECT
  profile_id,
  name,
  avatar_url
FROM public.profiles;

COMMENT ON VIEW public.public_profiles IS
  '공개용 프로필: profile_id, name, avatar_url. authenticated만 SELECT 가능.';

-- 로그인한 유저만 뷰 조회 허용 (profiles RLS는 변경하지 않음)
GRANT SELECT ON public.public_profiles TO authenticated;

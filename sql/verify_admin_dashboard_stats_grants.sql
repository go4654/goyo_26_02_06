-- =============================================================================
-- get_admin_dashboard_stats() 권한 상태 확인
-- 실행 후 EXECUTE 권한이 'authenticated'에만 있는지 확인
-- =============================================================================

-- 1) pg_proc: 함수 존재 및 소유자
SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'get_admin_dashboard_stats';

-- 2) information_schema.role_routine_grants: EXECUTE 권한 부여 대상
SELECT
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'get_admin_dashboard_stats'
ORDER BY grantee, privilege_type;

-- 3) PUBLIC에 권한이 있으면 제거 필요 (REVOKE ... FROM PUBLIC 후 위 쿼리 재실행 시 grantee에 public이 없어야 함)

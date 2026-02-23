-- =============================================================================
-- get_admin_dashboard_stats() 권한 정리 (최소 권한 원칙)
-- - PUBLIC EXECUTE 제거, authenticated만 EXECUTE 허용
-- - 함수/로직/데이터 변경 없음, 권한만 정리
-- =============================================================================

REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

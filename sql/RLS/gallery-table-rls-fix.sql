-- ===============================
-- GALLERIES 테이블 RLS 정책 수정
-- ===============================
-- 1) admin INSERT/UPDATE/DELETE: public.is_admin() 사용 (RLS 재귀 방지)
-- 2) 노출 해제 후 수정 시 "new row violates" 방지: UPDATE 시 새 행이 SELECT 정책에도
--    검사되므로, 관리자 전용 SELECT 정책 추가 (관리자는 is_published 무관 조회)

-- 기존 정책 제거 (INSERT/UPDATE/DELETE만, select-gallery는 유지)
DROP POLICY IF EXISTS "admin-insert-gallery" ON galleries;
DROP POLICY IF EXISTS "admin-update-gallery" ON galleries;
DROP POLICY IF EXISTS "admin-delete-gallery" ON galleries;

-- 관리자 SELECT: 모든 행 조회 가능 (노출 해제 수정 시 새 행이 정책 통과)
DROP POLICY IF EXISTS "select-gallery-admin" ON galleries;
CREATE POLICY "select-gallery-admin" ON galleries
AS PERMISSIVE FOR SELECT TO authenticated
USING (public.is_admin());

-- INSERT: 관리자만
CREATE POLICY "admin-insert-gallery" ON galleries
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- UPDATE: 관리자만 (USING + WITH CHECK 둘 다 is_admin())
CREATE POLICY "admin-update-gallery" ON galleries
AS PERMISSIVE FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: 관리자만
CREATE POLICY "admin-delete-gallery" ON galleries
AS PERMISSIVE FOR DELETE TO authenticated
USING (public.is_admin());

-- ===============================
-- NEWS 테이블 RLS 정책 수정
-- ===============================
-- 1) admin INSERT/UPDATE/DELETE: public.is_admin() 사용 (RLS 재귀 방지)
-- 2) 공개 해제 후 수정 시 "new row violates" 방지: UPDATE 시 새 행이 SELECT 정책에도
--    검사되므로, 관리자 전용 SELECT 정책 추가 (관리자는 is_published 무관 조회)

-- 기존 정책 제거 (INSERT/UPDATE/DELETE만, select-news는 유지)
DROP POLICY IF EXISTS "admin-insert-news" ON news;
DROP POLICY IF EXISTS "admin-update-news" ON news;
DROP POLICY IF EXISTS "admin-delete-news" ON news;

-- 관리자 SELECT: 모든 행 조회 가능 (비공개 수정 시 새 행이 정책 통과)
DROP POLICY IF EXISTS "select-news-admin" ON news;
CREATE POLICY "select-news-admin" ON news
AS PERMISSIVE FOR SELECT TO authenticated
USING (public.is_admin());

-- INSERT: 관리자만
CREATE POLICY "admin-insert-news" ON news
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- UPDATE: 관리자만 (USING + WITH CHECK 둘 다 is_admin())
CREATE POLICY "admin-update-news" ON news
AS PERMISSIVE FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: 관리자만
CREATE POLICY "admin-delete-news" ON news
AS PERMISSIVE FOR DELETE TO authenticated
USING (public.is_admin());

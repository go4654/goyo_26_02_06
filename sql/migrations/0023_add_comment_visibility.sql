-- =============================================================================
-- 댓글 가시성(is_visible) 기능 추가
-- =============================================================================
-- 1. class_comments 테이블에 is_visible 컬럼 추가
-- 2. 기존 데이터는 모두 true로 설정 (기본값)
-- 3. SELECT 정책 수정: 일반 유저는 is_visible=true만, 관리자는 모든 댓글 조회 가능
-- =============================================================================

-- 1️⃣ 컬럼 추가
ALTER TABLE public.class_comments
ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- 2️⃣ 기존 SELECT 정책 제거
DROP POLICY IF EXISTS "select-class-comments" ON public.class_comments;

-- 3️⃣ 새로운 SELECT 정책 생성
CREATE POLICY "select-class-comments" ON public.class_comments
AS PERMISSIVE
FOR SELECT
TO public
USING (
  -- 기본 조건: 삭제되지 않은 댓글
  is_deleted = false
  -- 클래스가 공개되어 있거나 관리자인 경우
  AND EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = class_comments.class_id
    AND c.is_deleted = false
    AND (
      c.is_published = true
      OR (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.profile_id = auth.uid()
          AND p.role = 'admin'
        )
      )
    )
  )
  -- 추가 조건: is_visible이 true이거나 관리자인 경우
  AND (
    is_visible = true
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.profile_id = auth.uid()
      AND p.role = 'admin'
    )
  )
);

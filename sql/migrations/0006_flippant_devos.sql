-- 하드 삭제 운영 시, FK CASCADE로 인한 대댓글 삭제까지 RLS로 허용하기 위한 헬퍼 함수
-- - 관리자: public.is_admin()
-- - 댓글 작성자: class_comments.user_id = auth.uid()
-- - 자식 댓글인 경우: 부모 댓글 작성자도 자식 댓글 DELETE 허용
CREATE OR REPLACE FUNCTION public.can_delete_class_comment(target_comment_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.class_comments c
      WHERE c.id = target_comment_id
        AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.class_comments child
      JOIN public.class_comments parent
        ON parent.id = child.parent_id
      WHERE child.id = target_comment_id
        AND parent.user_id = auth.uid()
    );
$$;--> statement-breakpoint

-- delete 정책에서 헬퍼 함수를 사용하도록 변경
ALTER POLICY "delete-class-comments"
ON "class_comments"
TO authenticated
USING (public.can_delete_class_comment("class_comments"."id"));
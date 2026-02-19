-- =============================================================================
-- 댓글 페이지네이션: 최상위 댓글 ID 목록 + 전체 최상위 댓글 수
-- 정렬: latest(최신순) / popular(인기순, likes_count 기준)
-- Supabase SQL Editor에 붙여넣기 후 실행
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_class_comments_page_ids(uuid, text, int, int);

CREATE OR REPLACE FUNCTION public.get_class_comments_page_ids(
  p_class_id uuid,
  p_sort_order text DEFAULT 'latest',
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
)
RETURNS TABLE (id uuid, total_top_level bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_total bigint;
BEGIN
  SELECT count(*)::bigint INTO v_total
  FROM public.class_comments
  WHERE class_id = p_class_id
    AND is_deleted = false
    AND parent_id IS NULL;

  IF p_sort_order = 'popular' THEN
    RETURN QUERY
    WITH likes_per_comment AS (
      SELECT cl.comment_id, count(*)::int AS cnt
      FROM public.comment_likes cl
      INNER JOIN public.class_comments cc ON cc.id = cl.comment_id
        AND cc.class_id = p_class_id
        AND cc.is_deleted = false
        AND cc.parent_id IS NULL
      GROUP BY cl.comment_id
    ),
    ordered AS (
      SELECT c.id
      FROM public.class_comments c
      LEFT JOIN likes_per_comment l ON c.id = l.comment_id
      WHERE c.class_id = p_class_id
        AND c.is_deleted = false
        AND c.parent_id IS NULL
      ORDER BY coalesce(l.cnt, 0) DESC, c.created_at DESC
      LIMIT greatest(p_limit, 0)
      OFFSET greatest(p_offset, 0)
    )
    SELECT o.id, v_total FROM ordered o;
  ELSE
    RETURN QUERY
    SELECT cc.id, v_total
    FROM public.class_comments cc
    WHERE cc.class_id = p_class_id
      AND cc.is_deleted = false
      AND cc.parent_id IS NULL
    ORDER BY cc.created_at DESC
    LIMIT greatest(p_limit, 0)
    OFFSET greatest(p_offset, 0);
  END IF;
END;
$$;

-- RPC 함수 최적화: get_classes_with_tags_and_user_status
-- 목적: user_liked_classes와 user_saved_classes를 페이지에 포함된 클래스 ID로만 필터링하여
--       불필요한 전체 조회를 방지하고 성능과 비용을 최적화합니다.

CREATE OR REPLACE FUNCTION public.get_classes_with_tags_and_user_status(
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 12,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  classes JSON,
  total_count BIGINT,
  liked_class_ids UUID[],
  saved_class_ids UUID[]
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
DECLARE
  v_offset INTEGER;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  RETURN QUERY
  WITH filtered_classes AS (
    SELECT
      c.id,
      c.title,
      c.description,
      c.category,
      c.slug,
      c.thumbnail_image_url,
      c.view_count,
      c.comment_count,
      c.published_at,
      c.created_at
    FROM public.classes c
    WHERE c.is_deleted = false
      AND c.is_published = true
      AND (
        (p_search IS NOT NULL AND (
          c.title ILIKE '%' || p_search || '%'
          OR c.description ILIKE '%' || p_search || '%'
        ))
        OR (p_search IS NULL AND (p_category IS NULL OR c.category = p_category))
      )
  ),
  paginated_classes AS (
    SELECT fc.*
    FROM filtered_classes fc
    ORDER BY fc.published_at DESC NULLS LAST, fc.created_at DESC
    LIMIT p_page_size OFFSET v_offset
  ),
  like_counts AS (
    SELECT
      cl.class_id,
      COUNT(*)::INTEGER AS like_count
    FROM public.class_likes cl
    WHERE cl.class_id IN (SELECT id FROM paginated_classes)
    GROUP BY cl.class_id
  ),
  save_counts AS (
    SELECT
      cs.class_id,
      COUNT(*)::INTEGER AS save_count
    FROM public.class_saves cs
    WHERE cs.class_id IN (SELECT id FROM paginated_classes)
    GROUP BY cs.class_id
  ),
  classes_with_counts AS (
    SELECT
      pc.id,
      pc.title,
      pc.description,
      pc.category,
      pc.slug,
      pc.thumbnail_image_url,
      pc.view_count,
      COALESCE(lc.like_count, 0) AS like_count,
      COALESCE(sc.save_count, 0) AS save_count,
      pc.comment_count,
      pc.published_at,
      pc.created_at
    FROM paginated_classes pc
    LEFT JOIN like_counts lc ON pc.id = lc.class_id
    LEFT JOIN save_counts sc ON pc.id = sc.class_id
  ),
  classes_with_tags AS (
    SELECT
      cc.*,
      COALESCE(
        json_agg(DISTINCT t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL),
        '[]'::json
      ) as tags
    FROM classes_with_counts cc
    LEFT JOIN public.class_tags ct ON cc.id = ct.class_id
    LEFT JOIN public.tags t ON ct.tag_id = t.id
    GROUP BY
      cc.id, cc.title, cc.description, cc.category, cc.slug,
      cc.thumbnail_image_url, cc.view_count, cc.like_count,
      cc.save_count, cc.comment_count, cc.published_at, cc.created_at
  ),
  user_liked_classes AS (
    -- 사용자가 좋아요한 클래스 ID 목록 (페이지에 포함된 클래스만)
    SELECT COALESCE(array_agg(cl.class_id), ARRAY[]::UUID[]) as class_ids
    FROM public.class_likes cl
    WHERE cl.user_id = p_user_id
      AND cl.class_id IN (SELECT id FROM paginated_classes)
  ),
  user_saved_classes AS (
    -- 사용자가 저장한 클래스 ID 목록 (페이지에 포함된 클래스만)
    SELECT COALESCE(array_agg(cs.class_id), ARRAY[]::UUID[]) as class_ids
    FROM public.class_saves cs
    WHERE cs.user_id = p_user_id
      AND cs.class_id IN (SELECT id FROM paginated_classes)
  )
  SELECT
    COALESCE(
      json_agg(
        json_build_object(
          'id', cwt.id,
          'title', cwt.title,
          'description', cwt.description,
          'category', cwt.category,
          'slug', cwt.slug,
          'thumbnail_image_url', cwt.thumbnail_image_url,
          'view_count', cwt.view_count,
          'like_count', cwt.like_count,
          'save_count', cwt.save_count,
          'comment_count', cwt.comment_count,
          'published_at', cwt.published_at,
          'created_at', cwt.created_at,
          'tags', cwt.tags
        )
        ORDER BY cwt.published_at DESC NULLS LAST, cwt.created_at DESC
      ),
      '[]'::json
    ) as classes,
    (SELECT COUNT(*) FROM filtered_classes) as total_count,
    COALESCE((SELECT class_ids FROM user_liked_classes), ARRAY[]::UUID[]) as liked_class_ids,
    COALESCE((SELECT class_ids FROM user_saved_classes), ARRAY[]::UUID[]) as saved_class_ids
  FROM classes_with_tags cwt;
END;
$$;

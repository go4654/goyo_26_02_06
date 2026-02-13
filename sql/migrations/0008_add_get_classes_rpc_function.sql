-- RPC 함수: get_classes_with_tags_and_user_status
-- 클래스 목록을 태그와 사용자 상태와 함께 효율적으로 조회하는 함수
-- 성능 최적화: 5개 쿼리 → 1개 쿼리로 감소

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
  -- 페이지네이션 offset 계산
  v_offset := (p_page - 1) * p_page_size;
  
  RETURN QUERY
  WITH filtered_classes AS (
    -- 필터링된 클래스 (카테고리/검색어 적용)
    SELECT 
      c.id,
      c.title,
      c.description,
      c.category,
      c.slug,
      c.thumbnail_image_url,
      c.view_count,
      c.like_count,
      c.save_count,
      c.comment_count,
      c.published_at,
      c.created_at
    FROM public.classes c
    WHERE c.is_deleted = false
      AND c.is_published = true
      AND (
        -- 검색어가 있으면 카테고리 무시하고 검색
        (p_search IS NOT NULL AND (
          c.title ILIKE '%' || p_search || '%' 
          OR c.description ILIKE '%' || p_search || '%'
        ))
        -- 검색어가 없으면 카테고리 필터 적용
        OR (p_search IS NULL AND (p_category IS NULL OR c.category = p_category))
      )
  ),
  paginated_classes AS (
    -- 페이지네이션 적용
    SELECT fc.*
    FROM filtered_classes fc
    ORDER BY fc.published_at DESC NULLS LAST, fc.created_at DESC
    LIMIT p_page_size OFFSET v_offset
  ),
  classes_with_tags AS (
    -- 태그를 JSON 배열로 추가
    SELECT 
      pc.*,
      COALESCE(
        json_agg(DISTINCT t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL),
        '[]'::json
      ) as tags
    FROM paginated_classes pc
    LEFT JOIN public.class_tags ct ON pc.id = ct.class_id
    LEFT JOIN public.tags t ON ct.tag_id = t.id
    GROUP BY 
      pc.id, pc.title, pc.description, pc.category, pc.slug,
      pc.thumbnail_image_url, pc.view_count, pc.like_count,
      pc.save_count, pc.comment_count, pc.published_at, pc.created_at
  ),
  user_liked_classes AS (
    -- 사용자가 좋아요한 클래스 ID 목록
    SELECT COALESCE(array_agg(class_id), ARRAY[]::UUID[]) as class_ids
    FROM public.class_likes
    WHERE user_id = p_user_id
  ),
  user_saved_classes AS (
    -- 사용자가 저장한 클래스 ID 목록
    SELECT COALESCE(array_agg(class_id), ARRAY[]::UUID[]) as class_ids
    FROM public.class_saves
    WHERE user_id = p_user_id
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

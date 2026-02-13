/**
 * 데이터베이스 함수: get_classes_with_tags_and_user_status
 * 
 * 클래스 목록을 태그와 사용자 상태(좋아요/저장)와 함께 효율적으로 조회합니다.
 * 
 * 기능:
 * - 클래스 목록 조회 (페이지네이션 지원)
 * - 카테고리 필터링 (검색어가 있을 때는 무시)
 * - 검색어 필터링 (제목/설명)
 * - 태그를 JSON 배열로 함께 반환
 * - 사용자의 좋아요/저장 상태를 배열로 반환
 * - 전체 개수 반환 (페이지네이션용)
 * 
 * 성능 최적화:
 * - 단일 쿼리로 모든 데이터 조회 (5개 쿼리 → 1개 쿼리)
 * - JSON aggregation으로 태그 효율적 처리
 * - 배열 aggregation으로 사용자 상태 효율적 처리
 * 
 * 보안 고려사항:
 * - SECURITY DEFINER를 사용하여 함수 소유자의 권한으로 실행
 * - 빈 search_path 설정으로 search path injection 공격 방지
 * - RLS 정책이 자동으로 적용됨
 * 
 * 사용법:
 * SELECT * FROM public.get_classes_with_tags_and_user_status(
 *   p_category := 'photoshop',
 *   p_search := NULL,
 *   p_page := 1,
 *   p_page_size := 12,
 *   p_user_id := 'user-uuid'
 * );
 * 
 * @param p_category - 카테고리 필터 (NULL이면 전체)
 * @param p_search - 검색어 (NULL이면 검색 안 함, 검색어가 있으면 카테고리 무시)
 * @param p_page - 페이지 번호 (1부터 시작)
 * @param p_page_size - 페이지당 항목 수
 * @param p_user_id - 사용자 ID (NULL이면 좋아요/저장 상태 없음)
 * @returns TABLE - classes (JSON), total_count (BIGINT), liked_class_ids (UUID[]), saved_class_ids (UUID[])
 */
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
  like_counts AS (
    -- 페이지에 포함된 클래스들의 좋아요 수 집계 (denormalized 컬럼에 의존하지 않음)
    SELECT
      cl.class_id,
      COUNT(*)::INTEGER AS like_count
    FROM public.class_likes cl
    WHERE cl.class_id IN (SELECT id FROM paginated_classes)
    GROUP BY cl.class_id
  ),
  save_counts AS (
    -- 페이지에 포함된 클래스들의 저장 수 집계 (denormalized 컬럼에 의존하지 않음)
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
    -- 태그를 JSON 배열로 추가
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

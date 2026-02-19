-- =============================================================================
-- 프로필 분석 RPC 함수 (Supabase SQL Editor에 붙여넣기용)
-- - get_profile_learning_summary: 학습 요약 (카테고리, 최근 학습일, 최근 주제, 저장 수)
-- - get_profile_weekly_learning: 최근 7일 일별 클래스 조회 수 (빈 날 0 채움)
-- - get_profile_recent_views: 최근 조회 클래스/갤러리 10건
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1️⃣ get_profile_learning_summary(user_uuid uuid)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_profile_learning_summary(uuid);

CREATE OR REPLACE FUNCTION public.get_profile_learning_summary(user_uuid uuid)
RETURNS TABLE (
  most_explored_category text,
  last_learning_date timestamptz,
  recent_topics text[],
  total_saved_classes int,
  total_saved_galleries int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- class_view_events + classes.category 기준 가장 많이 본 카테고리
    (SELECT c.category
     FROM public.class_view_events e
     JOIN public.classes c ON c.id = e.class_id
     WHERE e.user_id = user_uuid
     GROUP BY c.category
     ORDER BY count(*) DESC
     LIMIT 1) AS most_explored_category,

    -- 클래스 조회 이벤트의 마지막 일시
    (SELECT max(e.created_at)
     FROM public.class_view_events e
     WHERE e.user_id = user_uuid) AS last_learning_date,

    -- 최근 조회한 클래스 제목 5개 (created_at desc)
    (SELECT COALESCE(
       (SELECT array_agg(t.title) FROM (
         SELECT c.title
         FROM public.class_view_events e
         JOIN public.classes c ON c.id = e.class_id
         WHERE e.user_id = user_uuid
         ORDER BY e.created_at DESC
         LIMIT 5
       ) t),
       ARRAY[]::text[]
     )) AS recent_topics,

    (SELECT count(*)::int FROM public.class_saves WHERE user_id = user_uuid) AS total_saved_classes,
    (SELECT count(*)::int FROM public.gallery_saves WHERE user_id = user_uuid) AS total_saved_galleries;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2️⃣ get_profile_weekly_learning(user_uuid uuid)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_profile_weekly_learning(uuid);

CREATE OR REPLACE FUNCTION public.get_profile_weekly_learning(user_uuid uuid)
RETURNS TABLE (
  date date,
  view_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH last_7_days AS (
    SELECT (current_date - s.n)::date AS d
    FROM generate_series(0, 6) AS s(n)
  ),
  daily_counts AS (
    SELECT date_trunc('day', e.created_at AT TIME ZONE 'UTC')::date AS d, count(*)::int AS cnt
    FROM public.class_view_events e
    WHERE e.user_id = user_uuid
      AND e.created_at >= (current_date - 6)::date
      AND e.created_at < (current_date + 1)::date
    GROUP BY date_trunc('day', e.created_at AT TIME ZONE 'UTC')::date
  )
  SELECT
    l.d AS date,
    COALESCE(d.cnt, 0) AS view_count
  FROM last_7_days l
  LEFT JOIN daily_counts d ON d.d = l.d
  ORDER BY l.d ASC;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3️⃣ get_profile_recent_views(user_uuid uuid)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_profile_recent_views(uuid);

CREATE OR REPLACE FUNCTION public.get_profile_recent_views(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  category text,
  type text,
  viewed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  (
    SELECT
      c.id,
      c.title,
      c.slug,
      c.category,
      'class'::text AS type,
      e.created_at AS viewed_at
    FROM public.class_view_events e
    JOIN public.classes c ON c.id = e.class_id
    WHERE e.user_id = user_uuid
  )
  UNION ALL
  (
    SELECT
      g.id,
      g.title,
      g.slug,
      COALESCE(g.category, 'all') AS category,
      'gallery'::text AS type,
      e.created_at AS viewed_at
    FROM public.gallery_view_events e
    JOIN public.galleries g ON g.id = e.gallery_id
    WHERE e.user_id = user_uuid
  )
  ORDER BY viewed_at DESC
  LIMIT 10;
END;
$$;

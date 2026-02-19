-- =============================================================================
-- 통합 RPC: get_profile_page_data(user_uuid uuid)
--
-- 프로필 페이지에 필요한 데이터를 한 번에 반환합니다.
-- 반환: 단일 JSONB 객체 (stats, learning_summary, weekly_learning, recent_views)
--
-- 보안: user_uuid = auth.uid() 검사 후 본인만 조회 가능.
-- 인덱스: user_id 기반 조회만 사용 (full scan 없음).
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_profile_page_data(uuid);

CREATE OR REPLACE FUNCTION public.get_profile_page_data(p_user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_week_start timestamptz;
  v_result    jsonb;
BEGIN
  -- 본인만 조회 가능
  IF p_user_uuid IS NULL OR p_user_uuid != auth.uid() THEN
    RETURN jsonb_build_object(
      'stats', jsonb_build_object(
        'saved_class_count', 0,
        'saved_gallery_count', 0,
        'weekly_learning_count', 0
      ),
      'learning_summary', jsonb_build_object(
        'most_explored_category', null,
        'last_learning_date', null,
        'recent_topics', '[]'::jsonb,
        'total_saved_classes', 0,
        'total_saved_galleries', 0
      ),
      'weekly_learning', '[]'::jsonb,
      'recent_views', '[]'::jsonb
    );
  END IF;

  v_week_start := date_trunc('week', now());

  SELECT jsonb_build_object(
    'stats', jsonb_build_object(
      'saved_class_count', (SELECT count(*)::bigint FROM public.class_saves WHERE user_id = p_user_uuid),
      'saved_gallery_count', (SELECT count(*)::bigint FROM public.gallery_saves WHERE user_id = p_user_uuid),
      'weekly_learning_count',
        (SELECT count(*)::bigint FROM public.class_view_events WHERE user_id = p_user_uuid AND created_at >= v_week_start)
        + (SELECT count(*)::bigint FROM public.gallery_view_events WHERE user_id = p_user_uuid AND created_at >= v_week_start)
    ),
    'learning_summary', (
      SELECT jsonb_build_object(
        'most_explored_category', (
          SELECT c.category
          FROM public.class_view_events e
          JOIN public.classes c ON c.id = e.class_id
          WHERE e.user_id = p_user_uuid
          GROUP BY c.category
          ORDER BY count(*) DESC
          LIMIT 1
        ),
        'last_learning_date', (
          SELECT max(e.created_at)
          FROM public.class_view_events e
          WHERE e.user_id = p_user_uuid
        ),
        'recent_topics', COALESCE(
          (
            SELECT jsonb_agg(t.title ORDER BY t.ord)
            FROM (
              SELECT c.title, row_number() OVER (ORDER BY e.created_at DESC) AS ord
              FROM public.class_view_events e
              JOIN public.classes c ON c.id = e.class_id
              WHERE e.user_id = p_user_uuid
            ) t
            WHERE t.ord <= 5
          ),
          '[]'::jsonb
        ),
        'total_saved_classes', (SELECT count(*)::int FROM public.class_saves WHERE user_id = p_user_uuid),
        'total_saved_galleries', (SELECT count(*)::int FROM public.gallery_saves WHERE user_id = p_user_uuid)
      )
    ),
    'weekly_learning', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', l.d::text, 'view_count', COALESCE(d.cnt, 0))
        ORDER BY l.d
      ), '[]'::jsonb)
      FROM (
        SELECT (current_date - s.n)::date AS d
        FROM generate_series(0, 6) AS s(n)
      ) l
      LEFT JOIN (
        SELECT date_trunc('day', e.created_at AT TIME ZONE 'UTC')::date AS d, count(*)::int AS cnt
        FROM public.class_view_events e
        WHERE e.user_id = p_user_uuid
          AND e.created_at >= (current_date - 6)::date
          AND e.created_at < (current_date + 1)::date
        GROUP BY date_trunc('day', e.created_at AT TIME ZONE 'UTC')::date
      ) d ON d.d = l.d
    ),
    'recent_views', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.viewed_at DESC NULLS LAST), '[]'::jsonb)
      FROM (
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
          WHERE e.user_id = p_user_uuid
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
          WHERE e.user_id = p_user_uuid
        )
        ORDER BY viewed_at DESC
        LIMIT 10
      ) t
    )
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- 사용 예: SELECT public.get_profile_page_data(auth.uid());

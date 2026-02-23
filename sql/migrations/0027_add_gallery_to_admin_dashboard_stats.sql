-- =============================================================================
-- get_admin_dashboard_stats()에 gallery 영역 추가
-- - gallery.top_viewed: 갤러리 조회수 TOP 3 (galleries.view_count)
-- - gallery.top_saved: 갤러리 저장수 TOP 3 (galleries.save_count)
-- - 기존 보안/권한/로직 유지
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  v_is_admin boolean;
  v_traffic json;
  v_users json;
  v_class json;
  v_comments json;
  v_gallery json;
  v_total_views bigint;
  v_gallery_views bigint;
  v_total_users bigint;
  v_today_users bigint;
  v_top_viewed json;
  v_top_saved json;
  v_gallery_top_viewed json;
  v_gallery_top_saved json;
  v_last_7_days_count bigint;
  v_hidden_count bigint;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.profile_id = auth.uid()
      AND p.role = 'admin'
  ) INTO v_is_admin;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- traffic
  SELECT
    (SELECT count(*)::bigint FROM public.class_view_events),
    (SELECT count(*)::bigint FROM public.gallery_view_events)
  INTO v_total_views, v_gallery_views;

  v_traffic := json_build_object(
    'total_views', v_total_views,
    'gallery_views', v_gallery_views
  );

  -- users
  SELECT
    (SELECT count(*)::bigint FROM public.profiles),
    (SELECT count(*)::bigint FROM public.profiles
     WHERE created_at >= (current_date AT TIME ZONE 'UTC')::timestamptz)
  INTO v_total_users, v_today_users;

  v_users := json_build_object(
    'total_users', v_total_users,
    'today_users', v_today_users
  );

  -- class TOP 3
  SELECT coalesce(
    (SELECT json_agg(t)
     FROM (
       SELECT c.id, c.title, c.view_count AS views_count
       FROM public.classes c
       WHERE c.is_deleted = false
       ORDER BY c.view_count DESC
       LIMIT 3
     ) t),
    '[]'::json
  ) INTO v_top_viewed;

  SELECT coalesce(
    (SELECT json_agg(t)
     FROM (
       SELECT c.id, c.title, c.save_count AS saves_count
       FROM public.classes c
       WHERE c.is_deleted = false
       ORDER BY c.save_count DESC
       LIMIT 3
     ) t),
    '[]'::json
  ) INTO v_top_saved;

  v_class := json_build_object(
    'top_viewed', v_top_viewed,
    'top_saved', v_top_saved
  );

  -- gallery TOP 3 (조회수 / 저장수)
  SELECT coalesce(
    (SELECT json_agg(t)
     FROM (
       SELECT g.id, g.title, g.view_count AS views_count
       FROM public.galleries g
       ORDER BY g.view_count DESC
       LIMIT 3
     ) t),
    '[]'::json
  ) INTO v_gallery_top_viewed;

  SELECT coalesce(
    (SELECT json_agg(t)
     FROM (
       SELECT g.id, g.title, g.save_count AS saves_count
       FROM public.galleries g
       ORDER BY g.save_count DESC
       LIMIT 3
     ) t),
    '[]'::json
  ) INTO v_gallery_top_saved;

  v_gallery := json_build_object(
    'top_viewed', v_gallery_top_viewed,
    'top_saved', v_gallery_top_saved
  );

  -- comments
  SELECT
    (SELECT count(*)::bigint FROM public.class_comments
     WHERE created_at >= (now() - interval '7 days')),
    (SELECT count(*)::bigint FROM public.class_comments
     WHERE is_visible = false)
  INTO v_last_7_days_count, v_hidden_count;

  v_comments := json_build_object(
    'last_7_days_count', v_last_7_days_count,
    'hidden_count', v_hidden_count
  );

  RETURN json_build_object(
    'traffic', v_traffic,
    'users', v_users,
    'class', v_class,
    'comments', v_comments,
    'gallery', v_gallery
  );
END;
$$;

COMMENT ON FUNCTION public.get_admin_dashboard_stats() IS
  '관리자 전용: 대시보드 통계(traffic/users/class/comments/gallery). SECURITY DEFINER, auth.uid() 기반 admin 검증.';

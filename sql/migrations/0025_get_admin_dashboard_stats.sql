-- =============================================================================
-- 관리자 대시보드 통계 단일 RPC: get_admin_dashboard_stats()
-- - SECURITY DEFINER + auth.uid() 기반 관리자 검증
-- - JSON 반환, 영역별(traffic/users/class/comments) 구조
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  -- 관리자 검증: auth.uid()로 호출자 식별, profiles.role = 'admin' 확인
  v_is_admin boolean;
  -- 영역별 결과
  v_traffic json;
  v_users json;
  v_class json;
  v_comments json;
  -- traffic
  v_total_views bigint;
  v_gallery_views bigint;
  -- users
  v_total_users bigint;
  v_today_users bigint;
  -- class (TOP 3 배열)
  v_top_viewed json;
  v_top_saved json;
  -- comments
  v_last_7_days_count bigint;
  v_hidden_count bigint;
BEGIN
  -- 1) 보안: 호출자가 관리자인지 명시적 검증 (RLS 우회 없이 auth.uid()만 사용)
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.profile_id = auth.uid()
      AND p.role = 'admin'
  ) INTO v_is_admin;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- 2) traffic: 단일 SELECT로 두 count 조회
  SELECT
    (SELECT count(*)::bigint FROM public.class_view_events),
    (SELECT count(*)::bigint FROM public.gallery_view_events)
  INTO v_total_views, v_gallery_views;

  v_traffic := json_build_object(
    'total_views', v_total_views,
    'gallery_views', v_gallery_views
  );

  -- 3) users: 단일 SELECT로 두 count 조회 (오늘 = UTC 기준 당일)
  SELECT
    (SELECT count(*)::bigint FROM public.profiles),
    (SELECT count(*)::bigint FROM public.profiles
     WHERE created_at >= (current_date AT TIME ZONE 'UTC')::timestamptz)
  INTO v_total_users, v_today_users;

  v_users := json_build_object(
    'total_users', v_total_users,
    'today_users', v_today_users
  );

  -- 4) class: 조회수/저장수 TOP 3 각각 ORDER BY + LIMIT 3
  -- TOP 3: 서브쿼리 ORDER BY + LIMIT 3 후 json_agg (순서 유지)
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

  -- 5) comments: 최근 7일 댓글 수, 숨김 댓글 수 (단일 SELECT)
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
    'comments', v_comments
  );
END;
$$;

COMMENT ON FUNCTION public.get_admin_dashboard_stats() IS
  '관리자 전용: 대시보드 통계(traffic/users/class/comments). SECURITY DEFINER, auth.uid() 기반 admin 검증.';

-- 최소 권한: PUBLIC 권한 제거 후 로그인 유저(authenticated)만 EXECUTE 허용
REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

/**
 * 데이터베이스 함수: get_profile_stats
 *
 * 프로필 화면용 유저 집계를 한 번의 호출로 반환합니다.
 *
 * 반환 항목:
 * - saved_class_count: 해당 유저가 저장한 클래스 수 (class_saves)
 * - saved_gallery_count: 해당 유저가 저장한 갤러리 수 (gallery_saves)
 * - weekly_learning_count: 이번 주(월요일 00:00~) 클래스/갤러리 조회 이벤트 수 (class_view_events + gallery_view_events)
 *
 * 보안:
 * - auth.uid()로 호출자만 본인 집계 조회 가능
 * - SECURITY DEFINER로 view_events(admin만 SELECT 가능) 읽은 뒤, auth.uid()로 필터링하여 건수만 반환
 * - SET SEARCH_PATH = '' 로 search path injection 방지
 *
 * 사용법:
 * SELECT * FROM public.get_profile_stats();
 *
 * @returns TABLE - saved_class_count, saved_gallery_count, weekly_learning_count (BIGINT)
 */
CREATE OR REPLACE FUNCTION public.get_profile_stats()
RETURNS TABLE (
  saved_class_count BIGINT,
  saved_gallery_count BIGINT,
  weekly_learning_count BIGINT
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
DECLARE
  v_uid UUID;
  v_week_start TIMESTAMPTZ;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    -- 비로그인 시 0 반환
    saved_class_count := 0;
    saved_gallery_count := 0;
    weekly_learning_count := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 이번 주 시작 (ISO 주: 월요일 00:00)
  v_week_start := date_trunc('week', now());

  RETURN QUERY
  SELECT
    (SELECT count(*)::BIGINT FROM public.class_saves WHERE user_id = v_uid) AS saved_class_count,
    (SELECT count(*)::BIGINT FROM public.gallery_saves WHERE user_id = v_uid) AS saved_gallery_count,
    (
      (SELECT count(*)::BIGINT FROM public.class_view_events WHERE user_id = v_uid AND created_at >= v_week_start)
      +
      (SELECT count(*)::BIGINT FROM public.gallery_view_events WHERE user_id = v_uid AND created_at >= v_week_start)
    ) AS weekly_learning_count;
END;
$$;

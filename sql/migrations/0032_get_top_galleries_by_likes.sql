-- =============================================================================
-- 관리자 전용 RPC: 좋아요 TOP 3 갤러리 조회
-- - admin-dashboard에서 사용
-- - SECURITY DEFINER 미사용 (SECURITY INVOKER)
-- - profiles.role='admin' 검사로 관리자만 허용
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_top_galleries_by_likes()
RETURNS TABLE (
  id uuid,
  title text,
  thumbnail_url text,
  like_count integer
)
LANGUAGE plpgsql
SET search_path = public, auth
STABLE
AS $$
DECLARE
  v_is_admin boolean;
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

  RETURN QUERY
  SELECT
    g.id,
    g.title,
    g.thumbnail_image_url AS thumbnail_url,
    count(l.id)::int AS like_count
  FROM public.galleries g
  LEFT JOIN public.gallery_likes l ON l.gallery_id = g.id
  GROUP BY g.id, g.title, g.thumbnail_image_url
  ORDER BY like_count DESC, g.created_at DESC
  LIMIT 3;
END;
$$;

COMMENT ON FUNCTION public.get_top_galleries_by_likes() IS
  '관리자 전용: 좋아요 TOP 3 갤러리(id/title/thumbnail_url/like_count). SECURITY INVOKER + profiles.role 검사.';

REVOKE ALL ON FUNCTION public.get_top_galleries_by_likes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_galleries_by_likes() TO authenticated;


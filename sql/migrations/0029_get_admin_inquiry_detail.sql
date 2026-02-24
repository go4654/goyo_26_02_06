-- 관리자 전용: 문의 상세 1건 조회 (inquiries + profiles + auth.users JOIN)
-- requireAdmin으로 보호된 로더에서만 호출하며, 함수 내부에서도 is_admin() 검사

CREATE OR REPLACE FUNCTION public.get_admin_inquiry_detail(p_inquiry_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  author_email text,
  author_nickname text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.category::text,
    i.status::text,
    i.created_at,
    i.updated_at,
    u.email::text AS author_email,
    p.name AS author_nickname
  FROM public.inquiries i
  LEFT JOIN public.profiles p ON p.profile_id = i.profile_id
  LEFT JOIN auth.users u ON u.id = i.profile_id
  WHERE i.id = p_inquiry_id
    AND (i.is_deleted IS NULL OR i.is_deleted = false)
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_inquiry_detail(uuid) TO authenticated;


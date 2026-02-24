-- 관리자 전용: 문의 목록 조회 (inquiries + profiles + auth.users JOIN)
-- requireAdmin으로 보호된 로더에서만 호출하며, 함수 내부에서도 is_admin() 검사

CREATE OR REPLACE FUNCTION public.get_admin_inquiries_list()
RETURNS TABLE (
  id uuid,
  title text,
  email text,
  nickname text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
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
    u.email::text,
    p.name AS nickname,
    i.status::text,
    i.created_at,
    i.updated_at
  FROM public.inquiries i
  LEFT JOIN public.profiles p ON p.profile_id = i.profile_id
  LEFT JOIN auth.users u ON u.id = i.profile_id
  WHERE (i.is_deleted IS NULL OR i.is_deleted = false)
  ORDER BY i.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_inquiries_list() TO authenticated;

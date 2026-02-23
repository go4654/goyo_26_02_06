-- 관리자 전용: auth.users + profiles JOIN 목록 조회
-- requireAdmin으로 보호된 로더에서만 호출하며, 함수 내부에서도 is_admin() 검사

CREATE OR REPLACE FUNCTION public.get_admin_users_list()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  name text,
  role text,
  gallery_access boolean,
  is_blocked boolean,
  last_active_at timestamptz
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
    u.id,
    u.email::text,
    u.created_at,
    p.name,
    p.role,
    p.gallery_access,
    p.is_blocked,
    p.last_active_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.profile_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- authenticated 역할에서 실행 허용 (실제 접근은 is_admin()으로 제한)
GRANT EXECUTE ON FUNCTION public.get_admin_users_list() TO authenticated;

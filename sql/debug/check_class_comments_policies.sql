-- class_comments에 적용된 RLS 정책 확인용
-- Supabase SQL Editor에서 실행하세요.

SELECT
  p.polname,
  p.polcmd,
  p.polpermissive,
  ARRAY(
    SELECT rolname
    FROM pg_roles r
    WHERE r.oid = ANY (p.polroles)
  ) AS roles,
  pg_get_expr(p.polqual, p.polrelid) AS using_expr,
  pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'class_comments'
ORDER BY p.polcmd, p.polname;

-- 현재 사용자 기준 관리자 여부 확인
SELECT public.is_admin() AS am_i_admin;


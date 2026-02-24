-- site_settings SELECT 정책을 public(anon + authenticated)으로 변경
-- 비로그인 사용자도 점검모드/배너/가입허용 설정을 읽을 수 있도록
DROP POLICY IF EXISTS "select-site-settings" ON "site_settings";
CREATE POLICY "select-site-settings" ON "site_settings" AS PERMISSIVE FOR SELECT TO "public" USING ("site_settings"."singleton_key" = 'global');

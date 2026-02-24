-- site_settings: maintenance_message만 idempotent 추가 (notice_version은 0028에서 이미 추가됨)
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maintenance_message" text;

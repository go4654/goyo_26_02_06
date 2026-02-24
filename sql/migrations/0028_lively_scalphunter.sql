-- site_settings 확장 (idempotent)
-- 이미 컬럼이 존재하는 환경에서도 마이그레이션이 실패하지 않도록 IF NOT EXISTS 사용
ALTER TABLE "site_settings"
ADD COLUMN IF NOT EXISTS "notice_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings"
ADD COLUMN IF NOT EXISTS "maintenance_message" text;
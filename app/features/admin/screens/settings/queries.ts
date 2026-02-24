/**
 * 사이트 설정 쿼리
 *
 * - loader/action에서만 사용 (클라이언트에서 Supabase 직접 호출 금지)
 * - getSiteSettings: singleton_key='global' 1행 조회, 없으면 에러
 * - updateSiteSettings: admin만 호출 (requireAdmin 보호)
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/** 조회용 사이트 설정 타입 (필요한 컬럼만) */
export interface SiteSettingsRow {
  id: string;
  singleton_key: string;
  maintenance_mode: boolean;
  signup_enabled: boolean;
  notice_enabled: boolean;
  notice_message: string | null;
  notice_variant: "info" | "warning" | "event";
  notice_version: number;
  maintenance_message: string | null;
  updated_at: string;
  created_at: string;
}

/** root/앱 전역에서 사용하는 설정 형태 (camelCase) */
export interface SiteSettingsForApp {
  maintenanceMode: boolean;
  signupEnabled: boolean;
  noticeEnabled: boolean;
  noticeMessage: string | null;
  noticeVariant: "info" | "warning" | "event";
  noticeVersion: number;
  maintenanceMessage: string | null;
}

export function toSiteSettingsForApp(row: SiteSettingsRow): SiteSettingsForApp {
  return {
    maintenanceMode: row.maintenance_mode,
    signupEnabled: row.signup_enabled,
    noticeEnabled: row.notice_enabled,
    noticeMessage: row.notice_message,
    noticeVariant: row.notice_variant,
    noticeVersion: row.notice_version,
    maintenanceMessage: row.maintenance_message,
  };
}

/** 업데이트 시 허용 필드 (camelCase → DB snake_case 매핑은 내부에서 처리, noticeVersion은 서버에서만 증가) */
export interface SiteSettingsPatch {
  maintenanceMode?: boolean;
  signupEnabled?: boolean;
  noticeEnabled?: boolean;
  noticeMessage?: string | null;
  noticeVariant?: "info" | "warning" | "event";
  maintenanceMessage?: string | null;
}

const SITE_SETTINGS_COLUMNS =
  "id, singleton_key, maintenance_mode, signup_enabled, notice_enabled, notice_message, notice_variant, notice_version, maintenance_message, updated_at, created_at" as const;

/**
 * site_settings에서 singleton_key='global' 1행 조회
 * 없으면 에러 (정상 상태에서는 항상 존재해야 함)
 */
export async function getSiteSettings(
  client: SupabaseClient<Database>,
): Promise<SiteSettingsRow> {
  const { data, error } = await client
    .from("site_settings")
    .select(SITE_SETTINGS_COLUMNS)
    .eq("singleton_key", "global")
    .single();

  if (error) {
    throw new Error(`사이트 설정 조회 실패: ${error.message}`);
  }

  if (!data) {
    throw new Error("사이트 설정이 없습니다. (singleton_key=global 행이 필요합니다.)");
  }

  return {
    id: data.id as string,
    singleton_key: data.singleton_key as string,
    maintenance_mode: data.maintenance_mode as boolean,
    signup_enabled: data.signup_enabled as boolean,
    notice_enabled: data.notice_enabled as boolean,
    notice_message: data.notice_message as string | null,
    notice_variant: data.notice_variant as "info" | "warning" | "event",
    notice_version: (data.notice_version as number) ?? 1,
    maintenance_message: data.maintenance_message as string | null,
    updated_at: data.updated_at as string,
    created_at: data.created_at as string,
  };
}

/**
 * singleton_key='global' 행만 업데이트, updated_at은 now()로 갱신.
 * 공지 메시지가 변경된 경우에만 notice_version을 서버에서 1 증가시킨다.
 */
export async function updateSiteSettings(
  client: SupabaseClient<Database>,
  patch: SiteSettingsPatch,
): Promise<void> {
  const current = await getSiteSettings(client);

  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.maintenanceMode !== undefined) row.maintenance_mode = patch.maintenanceMode;
  if (patch.signupEnabled !== undefined) row.signup_enabled = patch.signupEnabled;
  if (patch.noticeEnabled !== undefined) row.notice_enabled = patch.noticeEnabled;
  if (patch.noticeMessage !== undefined) row.notice_message = patch.noticeMessage;
  if (patch.noticeVariant !== undefined) row.notice_variant = patch.noticeVariant;
  if (patch.maintenanceMessage !== undefined)
    row.maintenance_message = patch.maintenanceMessage;

  if (patch.noticeMessage !== undefined && patch.noticeMessage !== current.notice_message) {
    row.notice_version = current.notice_version + 1;
  }

  const { error } = await client
    .from("site_settings")
    .update(row)
    .eq("singleton_key", "global");

  if (error) {
    throw new Error(`사이트 설정 저장 실패: ${error.message}`);
  }
}

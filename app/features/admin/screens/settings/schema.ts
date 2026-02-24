/**
 * 사이트 설정 스키마 (싱글톤)
 *
 * - site_settings는 항상 1행(singleton_key='global')만 존재
 * - RLS: SELECT는 authenticated 모두, UPDATE/INSERT/DELETE는 admin만
 * - SECURITY DEFINER 사용하지 않음 (profiles.role로 admin 판별)
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

/** admin 여부: profiles에서 role='admin'인 행 존재 여부 (SECURITY DEFINER 미사용) */
const isAdminByProfile = sql`EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.profile_id = ${authUid}
  AND p.role = 'admin'
)`;

export const siteSettings = pgTable(
  "site_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    singleton_key: text("singleton_key").notNull().unique().default("global"),

    maintenance_mode: boolean("maintenance_mode").notNull().default(false),
    signup_enabled: boolean("signup_enabled").notNull().default(true),
    notice_enabled: boolean("notice_enabled").notNull().default(false),
    notice_message: text("notice_message"),
    notice_variant: text("notice_variant").notNull().default("info"),
    notice_version: integer("notice_version").notNull().default(1),
    maintenance_message: text("maintenance_message"),

    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "site_settings_notice_variant_check",
      sql`${table.notice_variant} IN ('info', 'warning', 'event')`,
    ),

    // SELECT: public(anon + authenticated) 조회 가능 (배너/가입허용/점검모드 읽기용)
    pgPolicy("select-site-settings", {
      for: "select",
      to: "public",
      as: "permissive",
      using: sql`${table.singleton_key} = 'global'`,
    }),

    // UPDATE: admin만
    pgPolicy("admin-update-site-settings", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: isAdminByProfile,
      withCheck: isAdminByProfile,
    }),

    // INSERT: admin만
    pgPolicy("admin-insert-site-settings", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: isAdminByProfile,
    }),

    // DELETE: admin만
    pgPolicy("admin-delete-site-settings", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: isAdminByProfile,
    }),
  ],
);

/**
 * User Profile Schema
 *
 * This file defines the database schema for user profiles and sets up
 * Supabase Row Level Security (RLS) policies to control data access.
 *
 * 보안 정책:
 * - RLS는 행 단위 접근 제어만 수행 (필드 단위 제어 불가)
 * - 일반 유저는 자신의 프로필만 조회 가능
 * - Admin은 모든 프로필 조회 가능
 * - 민감 필드(role, gallery_access, is_blocked, blocked_reason)는 서버 측에서 필터링 필요
 * - getUserProfile() 함수가 일반 유저용으로 민감 필드를 제외하여 반환
 * - getAdminProfile() 함수가 Admin용으로 모든 필드를 반환
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

/**
 * Profiles Table
 *
 * Stores additional user profile information beyond the core auth data.
 * Links to Supabase auth.users table via profile_id foreign key.
 *
 * Includes Row Level Security (RLS) policies to ensure users can only
 * access and modify their own profile data.
 */
export const profiles = pgTable(
  "profiles",
  {
    // Primary key that references the Supabase auth.users id
    // Using CASCADE ensures profile is deleted when user is deleted
    profile_id: uuid()
      .primaryKey()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),
    name: text().notNull(),
    avatar_url: text(),
    marketing_consent: boolean("marketing_consent").notNull().default(false),

    // 유저 권한: 'user' (default) or 'admin'
    role: text("role").notNull().default("user"),

    // ✅ gallery 접근 권한
    gallery_access: boolean("gallery_access").notNull().default(false),

    // ✅ 최근 활동 시간
    last_active_at: timestamp("last_active_at", { withTimezone: true }),

    // ✅ 계정 차단 여부
    is_blocked: boolean("is_blocked").notNull().default(false),

    // ✅ 차단 사유
    blocked_reason: text("blocked_reason"),

    admin_note: text("admin_note"),

    // 생성일 및 수정일
    ...timestamps,
  },
  (table) => [
    // =========================================
    // 일반 사용자: 자신의 프로필 수정 가능
    // =========================================
    pgPolicy("user-update-own-profile", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        ${authUid} = ${table.profile_id}
        AND NOT EXISTS (
          SELECT 1 FROM ${table} p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
      withCheck: sql`
        ${authUid} = ${table.profile_id}
      `,
    }),

    // =========================================
    // 관리자: 모든 프로필 수정 가능
    // =========================================
    pgPolicy("admin-update-all-profiles", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        EXISTS (
          SELECT 1 FROM ${table} p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
      withCheck: sql`
        EXISTS (
          SELECT 1 FROM ${table} p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
    }),

    // =========================================
    // SELECT 정책
    // =========================================
    // 보안: 일반 유저는 자신의 프로필만 조회 가능
    // Admin은 모든 프로필 조회 가능 (서버 측에서 필드 필터링 필요)
    pgPolicy("select-profile", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        ${authUid} = ${table.profile_id}
        OR EXISTS (
          SELECT 1 FROM ${table} p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
    }),

    // =========================================
    // DELETE 정책
    // =========================================
    pgPolicy("delete-profile", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        ${authUid} = ${table.profile_id}
        OR EXISTS (
          SELECT 1 FROM ${table} p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
    }),
  ],
);

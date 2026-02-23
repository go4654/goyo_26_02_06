import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { pgPolicy } from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { profiles } from "../users/schema";

const isAdmin = sql`public.is_admin()`;

/**
 * ---------------------------------------------------------------
 * is_deleted(소프트 삭제) 사용 시 SELECT / UPDATE 예시
 * ---------------------------------------------------------------
 *
 * [SELECT - 유저 목록] 삭제되지 않은 본인 문의만 (RLS가 이미 is_deleted = false 필터링)
 *   db.select().from(inquiries).where(eq(inquiries.profile_id, profileId))
 *   → RLS로 인해 is_deleted = false 인 행만 반환됨. 별도 .where() 불필요.
 *
 * [SELECT - 관리자 목록] 전체 조회 시 삭제 제외하려면 앱에서 필터
 *   db.select().from(inquiries).where(eq(inquiries.is_deleted, false))
 *
 * [UPDATE - 소프트 삭제] 유저가 본인 문의 삭제
 *   db.update(inquiries)
 *     .set({ is_deleted: true, updated_at: new Date() })
 *     .where(and(eq(inquiries.id, inquiryId), eq(inquiries.profile_id, profileId)))
 *   → RLS update-own-inquiry로 본인 행만 허용.
 *
 * [UPDATE - 관리자] 상태 변경 또는 물리 삭제 전 플래그
 *   db.update(inquiries).set({ status: 'closed', updated_at: new Date() }).where(eq(inquiries.id, id))
 *   → RLS admin-update-inquiry로 허용.
 *
 * [DELETE] 물리 삭제는 관리자만 (RLS admin-delete-inquiry). 유저는 DELETE 불가.
 * ---------------------------------------------------------------
 */

//
// ENUM 정의
//
export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "pending",
  "answered",
  "closed",
]);

export const inquiryCategoryEnum = pgEnum("inquiry_category", [
  "general",
  "class",
  "gallery",
  "account",
  "etc",
]);

export const inquiryAuthorRoleEnum = pgEnum("inquiry_author_role", [
  "user",
  "admin",
]);

//
// =========================
// inquiries (티켓)
// =========================
//
export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    profile_id: uuid("profile_id")
      .notNull()
      .references(() => profiles.profile_id, { onDelete: "cascade" }),

    title: text("title").notNull(),

    category: inquiryCategoryEnum("category").notNull().default("general"),

    status: inquiryStatusEnum("status").notNull().default("pending"),

    last_activity_at: timestamp("last_activity_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    is_deleted: boolean("is_deleted").notNull().default(false),

    created_at: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updated_at: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inquiries_profile_idx").on(table.profile_id, table.created_at),
    index("inquiries_status_idx").on(table.status, table.last_activity_at),
    index("inquiries_not_deleted_idx").on(table.is_deleted),
    index("inquiries_profile_not_deleted_idx").on(
      table.profile_id,
      table.is_deleted,
      table.created_at,
    ),

    //
    // SELECT: 유저는 삭제되지 않은 본인 문의만 조회
    //
    pgPolicy("select-own-inquiry", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.profile_id} = ${authUid} AND ${table.is_deleted} = false`,
    }),

    // 관리자 전체 조회
    pgPolicy("select-inquiry-admin", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: isAdmin,
    }),

    //
    // =========================
    // INSERT
    // =========================
    //
    pgPolicy("insert-own-inquiry", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${table.profile_id} = ${authUid}`,
    }),

    //
    // =========================
    // UPDATE
    // =========================
    //
    // 유저: 본인 문의만 수정 (소프트 삭제 = is_deleted = true 로 UPDATE)
    pgPolicy("update-own-inquiry", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.profile_id} = ${authUid}`,
      withCheck: sql`${table.profile_id} = ${authUid}`,
    }),

    // 관리자 수정 가능
    pgPolicy("admin-update-inquiry", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: isAdmin,
      withCheck: isAdmin,
    }),

    //
    // =========================
    // DELETE
    // =========================
    //
    pgPolicy("admin-delete-inquiry", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: isAdmin,
    }),
  ],
);

//
// =========================
// inquiry_messages (대화)
// =========================
//
export const inquiryMessages = pgTable(
  "inquiry_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    inquiry_id: uuid("inquiry_id")
      .notNull()
      .references(() => inquiries.id, { onDelete: "cascade" }),

    author_profile_id: uuid("author_profile_id")
      .notNull()
      .references(() => profiles.profile_id, { onDelete: "cascade" }),

    author_role: inquiryAuthorRoleEnum("author_role").notNull(),

    content: text("content").notNull(),

    created_at: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inquiry_messages_idx").on(table.inquiry_id, table.created_at),

    //
    // =========================
    // SELECT 정책
    // =========================
    //
    pgPolicy("select-own-inquiry-messages", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
          EXISTS (
            SELECT 1
            FROM inquiries i
            WHERE i.id = ${table.inquiry_id}
            AND i.profile_id = ${authUid}
            AND i.is_deleted = false
          )
        `,
    }),

    pgPolicy("select-inquiry-messages-admin", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: isAdmin,
    }),

    //
    // =========================
    // INSERT
    // =========================
    //
    pgPolicy("insert-own-inquiry-message", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${table.author_profile_id} = ${authUid}`,
    }),

    //
    // =========================
    // DELETE (관리자만)
    // =========================
    //
    pgPolicy("admin-delete-inquiry-message", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: isAdmin,
    }),
  ],
);

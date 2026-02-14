import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

import { profiles } from "../users/schema";

export const news = pgTable(
  "news",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // =========================
    // 기본 정보
    // =========================
    title: text("title").notNull(),
    category: text("category").notNull().default("notice"),

    slug: text("slug").notNull().unique(),

    // 본문 (MDX)
    content_mdx: text("content_mdx").notNull(),

    // =========================
    // 공개 설정
    // =========================
    visibility: text("visibility").notNull().default("public"),
    // public | member

    is_published: boolean("is_published").notNull().default(true),

    // =========================
    // 통계
    // =========================
    view_count: integer("view_count").notNull().default(0),

    // =========================
    // 작성자
    // =========================
    author_id: uuid("author_id").references(() => profiles.profile_id, {
      onDelete: "restrict",
    }),

    published_at: timestamp("published_at", {
      withTimezone: true,
    }).defaultNow(),

    ...timestamps,
  },

  (table) => [
    index("news_slug_idx").on(table.slug),
    index("news_category_idx").on(table.category),
    index("news_published_idx").on(table.is_published),

    // =========================
    // SELECT 정책
    // =========================
    pgPolicy("select-news", {
      for: "select",
      to: "public",
      as: "permissive",
      using: sql`
        ${table.is_published} = true
        AND (
          ${table.visibility} = 'public'
          OR (
            ${table.visibility} = 'member'
            AND ${authUid} IS NOT NULL
          )
        )
      `,
    }),

    // =========================
    // INSERT (관리자만)
    // =========================
    pgPolicy("admin-insert-news", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
    }),

    // =========================
    // UPDATE (관리자만)
    // =========================
    pgPolicy("admin-update-news", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
      withCheck: sql`
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
    }),

    // =========================
    // DELETE (관리자만)
    // =========================
    pgPolicy("admin-delete-news", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
    }),
  ],
);

// =============================================
// NEWS 조회 이벤트 테이블
// =============================================
export const newsViewEvents = pgTable(
  "news_view_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    news_id: uuid("news_id")
      .notNull()
      .references(() => news.id, { onDelete: "cascade" }),

    // 로그인 유저
    user_id: uuid("user_id").references(() => profiles.profile_id, {
      onDelete: "set null",
    }),

    // 비로그인 추적용 (쿠키/세션ID)
    anon_id: text("anon_id"),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("news_view_events_news_id_idx").on(table.news_id),
    index("news_view_events_user_id_idx").on(table.user_id),
    index("news_view_events_created_at_idx").on(table.created_at),

    // =========================
    // SELECT → 관리자만 조회 가능
    // =========================
    pgPolicy("select-news-view-events-admin-only", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.profile_id = ${authUid}
            AND p.role = 'admin'
          )
        `,
    }),

    // =========================
    // INSERT
    // =========================
    // 로그인 유저는 user_id = authUid 강제
    pgPolicy("insert-news-view-events-auth", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`
          ${table.user_id} = ${authUid}
        `,
    }),

    // anon insert 허용
    pgPolicy("insert-news-view-events-anon", {
      for: "insert",
      to: "anon",
      as: "permissive",
      withCheck: sql`true`,
    }),
  ],
);

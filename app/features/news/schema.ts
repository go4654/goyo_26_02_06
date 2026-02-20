import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

import { NEWS_CATEGORIES } from "./constants/news-categories";
import { profiles } from "../users/schema";

/** 관리자 여부 (SECURITY DEFINER, RLS 재귀 방지) */
const isAdmin = sql`public.is_admin()`;

/** DB enum: 뉴스 카테고리 (공지 / 업데이트 / 뉴스). 값은 constants/news-categories.ts와 동기화 */
export const newsCategory = pgEnum("news_category", [...NEWS_CATEGORIES]);

export const news = pgTable(
  "news",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // =========================
    // 기본 정보
    // =========================
    title: text("title").notNull(),
    category: newsCategory("category").notNull().default("notice"),

    slug: text("slug").notNull().unique(),

    // 본문 (MDX)
    content_mdx: text("content_mdx").notNull(),

    thumbnail_image_url: text("thumbnail_image_url"),

    // 상세 상단 이미지들 (hero, section 등)
    cover_image_urls: text("cover_image_urls")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),

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
    // 공개된 뉴스만 조회 (공개 여부 true, visibility 조건)
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
    // 관리자는 모든 행 조회 가능 (비공개 수정 시 UPDATE 새 행이 SELECT 정책에도 통과하도록)
    pgPolicy("select-news-admin", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: isAdmin,
    }),

    // =========================
    // INSERT (관리자만, is_admin()로 RLS 재귀 방지)
    // =========================
    pgPolicy("admin-insert-news", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: isAdmin,
    }),

    // =========================
    // UPDATE (관리자만, is_admin()로 RLS 재귀 방지)
    // =========================
    pgPolicy("admin-update-news", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: isAdmin,
      withCheck: isAdmin,
    }),

    // =========================
    // DELETE (관리자만)
    // =========================
    pgPolicy("admin-delete-news", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: isAdmin,
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

import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

import { tags } from "../class/schema";
import { profiles } from "../users/schema";

/** 관리자 여부 (SECURITY DEFINER, RLS 재귀·UPDATE 새 행 검사 대응) */
const isAdmin = sql`public.is_admin()`;

export const galleries = pgTable(
  "galleries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // =========================
    // 기본 정보
    // =========================
    title: text("title").notNull(),
    category: text("category").notNull().default("design"),
    subtitle: text("subtitle"),
    description: text("description"),
    caption: text("caption"),

    // 대표 이미지
    thumbnail_image_url: text("thumbnail_image_url"),

    // 상세 이미지들
    image_urls: text("image_urls")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),

    slug: text("slug").notNull().unique(),

    // =========================
    // 업로드 관리자
    // =========================
    author_id: uuid("author_id").references(() => profiles.profile_id, {
      onDelete: "restrict",
    }),

    // =========================
    // 노출 설정
    // =========================
    is_published: boolean("is_published").notNull().default(true),
    // is_deleted: boolean("is_deleted").notNull().default(false),

    // =========================
    // 통계
    // =========================
    view_count: integer("view_count").notNull().default(0),
    like_count: integer("like_count").notNull().default(0),
    save_count: integer("save_count").notNull().default(0),

    ...timestamps,
  },
  (table) => [
    index("galleries_published_idx").on(table.is_published),
    index("galleries_category_idx").on(table.category),

    // =========================
    // SELECT 정책
    // =========================
    // 노출된 갤러리만 조회 (gallery_access 또는 admin)
    pgPolicy("select-gallery", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
          ${table.is_published} = true
          AND EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.profile_id = ${authUid}
            AND (p.gallery_access = true OR p.role = 'admin')
          )
        `,
    }),
    // 관리자는 모든 행 조회 가능 (노출 해제 수정 시 UPDATE 새 행이 SELECT 정책 통과)
    pgPolicy("select-gallery-admin", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: isAdmin,
    }),

    // =========================
    // INSERT (관리자만, is_admin()로 RLS 재귀 방지)
    // =========================
    pgPolicy("admin-insert-gallery", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: isAdmin,
    }),

    // =========================
    // UPDATE (관리자만)
    // =========================
    pgPolicy("admin-update-gallery", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: isAdmin,
      withCheck: isAdmin,
    }),

    // =========================
    // DELETE (관리자만)
    // =========================
    pgPolicy("admin-delete-gallery", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: isAdmin,
    }),
  ],
);

// =============================================
// GALLERY 좋아요 테이블
// =============================================

export const galleryLikes = pgTable(
  "gallery_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    gallery_id: uuid("gallery_id")
      .notNull()
      .references(() => galleries.id, { onDelete: "cascade" }),

    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.profile_id, { onDelete: "cascade" }),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // 한 유저가 한 갤러리에 중복 좋아요 방지
    uniqueIndex("gallery_likes_unique_user_gallery").on(
      table.user_id,
      table.gallery_id,
    ),

    index("gallery_likes_gallery_id_idx").on(table.gallery_id),
    index("gallery_likes_user_id_idx").on(table.user_id),

    // =========================
    // SELECT
    // =========================
    pgPolicy("select-gallery-likes", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.user_id} = ${authUid} OR public.is_admin()`,
    }),

    // =========================
    // INSERT
    // =========================
    pgPolicy("insert-gallery-likes", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${table.user_id} = ${authUid}`,
    }),

    // =========================
    // DELETE (좋아요 취소)
    // =========================
    pgPolicy("delete-gallery-likes", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.user_id} = ${authUid} OR public.is_admin()`,
    }),
  ],
);

// =============================================
// GALLERY 저장 테이블
// =============================================

export const gallerySaves = pgTable(
  "gallery_saves",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    gallery_id: uuid("gallery_id")
      .notNull()
      .references(() => galleries.id, { onDelete: "cascade" }),

    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.profile_id, { onDelete: "cascade" }),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // 중복 저장 방지
    uniqueIndex("gallery_saves_unique_user_gallery").on(
      table.user_id,
      table.gallery_id,
    ),

    index("gallery_saves_gallery_id_idx").on(table.gallery_id),
    index("gallery_saves_user_id_idx").on(table.user_id),

    // =========================
    // SELECT
    // =========================
    pgPolicy("select-gallery-saves", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.user_id} = ${authUid} OR public.is_admin()`,
    }),

    // =========================
    // INSERT
    // =========================
    pgPolicy("insert-gallery-saves", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${table.user_id} = ${authUid}`,
    }),

    // =========================
    // DELETE (저장 취소)
    // =========================
    pgPolicy("delete-gallery-saves", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.user_id} = ${authUid} OR public.is_admin()`,
    }),
  ],
);

// =============================================
// GALLERY 태그 테이블
// =============================================

export const galleryTags = pgTable(
  "gallery_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    gallery_id: uuid("gallery_id")
      .notNull()
      .references(() => galleries.id, { onDelete: "cascade" }),

    tag_id: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("gallery_tags_unique").on(table.gallery_id, table.tag_id),
    index("gallery_tags_gallery_id_idx").on(table.gallery_id),
    index("gallery_tags_tag_id_idx").on(table.tag_id),

    // SELECT: 갤러리 접근 권한 있는 유저만
    pgPolicy("select-gallery-tags", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
          EXISTS (
            SELECT 1 FROM galleries g
            WHERE g.id = ${table.gallery_id}
            AND g.is_published = true
          )
        `,
    }),

    // INSERT: 관리자만
    pgPolicy("insert-gallery-tags", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`public.is_admin()`,
    }),

    pgPolicy("delete-gallery-tags", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`public.is_admin()`,
    }),
  ],
);

// =============================================
// GALLERY 조회 이벤트 테이블
// =============================================

export const galleryViewEvents = pgTable(
  "gallery_view_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    gallery_id: uuid("gallery_id")
      .notNull()
      .references(() => galleries.id, { onDelete: "cascade" }),

    // 로그인 유저면 user_id, 아니면 null
    user_id: uuid("user_id").references(() => profiles.profile_id, {
      onDelete: "set null",
    }),

    // 비로그인 추적용 (선택)
    anon_id: text("anon_id"),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("gallery_view_events_gallery_id_idx").on(table.gallery_id),
    index("gallery_view_events_user_id_idx").on(table.user_id),
    index("gallery_view_events_created_at_idx").on(table.created_at),

    // 관리자만 조회 가능
    pgPolicy("select-gallery-view-events-admin-only", {
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

    // 로그인 유저 insert
    pgPolicy("insert-gallery-view-events-auth", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${table.user_id} = ${authUid}`,
    }),

    // anon insert 허용
    pgPolicy("insert-gallery-view-events-anon", {
      for: "insert",
      to: "anon",
      as: "permissive",
      withCheck: sql`true`,
    }),
  ],
);

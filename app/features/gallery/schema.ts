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

import { profiles } from "../users/schema";

export const galleries = pgTable(
  "galleries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // =========================
    // 기본 정보
    // =========================
    title: text("title").notNull(),
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
    index("galleries_slug_idx").on(table.slug),
    index("galleries_published_idx").on(table.is_published),

    // =========================
    // SELECT 정책
    // =========================
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

    // =========================
    // INSERT (관리자만)
    // =========================
    pgPolicy("admin-insert-gallery", {
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
    pgPolicy("admin-update-gallery", {
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
    pgPolicy("admin-delete-gallery", {
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

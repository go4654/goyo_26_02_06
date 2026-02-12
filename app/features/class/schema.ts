import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
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

/**

* =============================================
* CLASSES TABLE (학습 콘텐츠)
* =============================================
*
* 설계 원칙
* * 공개 콘텐츠 (비로그인 조회 가능)
* * 관리자만 생성 / 수정 / 삭제
* * soft delete
* * slug 기반 라우팅
* * 이미지 배열 지원
* * 통계 컬럼 분리 (성능)
* * 필터링 성능 인덱스
    */

export const classes = pgTable(
  "classes",
  {
    // ===============================
    // PK
    // ===============================
    id: uuid("id").primaryKey().defaultRandom(),

    // ===============================
    // 콘텐츠 기본 정보
    // ===============================
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),

    // URL slug
    slug: text("slug").notNull().unique(),

    // ===============================
    // 이미지
    // ===============================
    thumbnail_image_url: text("thumbnail_image_url"),

    // 상세 상단 이미지들 (hero, section 등)
    cover_image_urls: text("cover_image_urls")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),

    // ===============================
    // 콘텐츠 본문
    // ===============================
    content_mdx: text("content_mdx").notNull(),

    // ===============================
    // 작성자 (관리자 계정)
    // ===============================
    author_id: uuid("author_id")
      .notNull()
      .references(() => profiles.profile_id, {
        onDelete: "restrict",
      }),

    // ===============================
    // 노출 설정
    // ===============================
    is_published: boolean("is_published").notNull().default(true),
    is_deleted: boolean("is_deleted").notNull().default(false),

    // ===============================
    // 통계 (성능용 denormalized counters)
    // ===============================
    view_count: integer("view_count").notNull().default(0),
    like_count: integer("like_count").notNull().default(0),
    save_count: integer("save_count").notNull().default(0),
    comment_count: integer("comment_count").notNull().default(0),

    // ===============================
    // 시간
    // ===============================
    published_at: timestamp("published_at", {
      withTimezone: true,
    }).defaultNow(),

    ...timestamps,
  },

  (table) => [
    // =========================================
    // 성능 인덱스
    // =========================================
    index("classes_slug_idx").on(table.slug),
    index("classes_category_idx").on(table.category),
    index("classes_not_deleted_idx").on(table.is_deleted),
    index("classes_published_idx").on(table.is_published),
    // 공개 콘텐츠 조회 최적화를 위한 복합 인덱스
    index("classes_public_idx").on(table.is_deleted, table.is_published),
    // 카테고리별 공개 콘텐츠 조회 최적화
    index("classes_category_public_idx").on(
      table.category,
      table.is_deleted,
      table.is_published,
    ),

    // =========================================
    // SELECT 정책 (공개 콘텐츠)
    // =========================================
    pgPolicy("select-class", {
      for: "select",
      to: "public", // anon + authenticated 모두 가능
      as: "permissive",
      using: sql`
    ${table.is_deleted} = false
    AND (
      ${table.is_published} = true
      OR (
        ${authUid} IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM profiles p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      )
    )
  `,
    }),

    // =========================================
    // INSERT (관리자만)
    // =========================================
    pgPolicy("admin-insert-class", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.profile_id = ${authUid}
      AND p.role = 'admin'
    )
  `,
    }),

    // =========================================
    // UPDATE (관리자만)
    // =========================================
    pgPolicy("admin-update-class", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.profile_id = ${authUid}
      AND p.role = 'admin'
    )
  `,
      withCheck: sql`
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.profile_id = ${authUid}
      AND p.role = 'admin'
    )
  `,
    }),

    // =========================================
    // DELETE (관리자만)
    // =========================================
    pgPolicy("admin-delete-class", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.profile_id = ${authUid}
      AND p.role = 'admin'
    )
  `,
    }),
  ],
);

// =============================================
// CLASS 좋아요 테이블
// =============================================

export const classLikes = pgTable(
  "class_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    class_id: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),

    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.profile_id, { onDelete: "cascade" }),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("class_likes_unique_user_class").on(t.user_id, t.class_id),
    index("class_likes_class_id_idx").on(t.class_id),
    index("class_likes_user_id_idx").on(t.user_id),

    // 로그인 유저: 본인 좋아요만 조회 / 관리자는 전체 조회
    pgPolicy("select-class-likes", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        ${t.user_id} = ${authUid}
        OR public.is_admin()
      `,
    }),

    // 로그인 유저: 좋아요 생성은 본인 것만
    pgPolicy("insert-class-likes", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${t.user_id} = ${authUid}`,
    }),

    // 로그인 유저: 좋아요 취소(삭제)는 본인 것만 / 관리자는 삭제 가능
    pgPolicy("delete-class-likes", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${t.user_id} = ${authUid} OR public.is_admin()`,
    }),
  ],
);

//
// =============================================
// CLASS 저장 테이블
// =============================================

export const classSaves = pgTable(
  "class_saves",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    class_id: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),

    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.profile_id, { onDelete: "cascade" }),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("class_saves_unique_user_class").on(t.user_id, t.class_id),
    index("class_saves_class_id_idx").on(t.class_id),
    index("class_saves_user_id_idx").on(t.user_id),

    pgPolicy("select-class-saves", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${t.user_id} = ${authUid} OR public.is_admin()`,
    }),

    pgPolicy("insert-class-saves", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${t.user_id} = ${authUid}`,
    }),

    pgPolicy("delete-class-saves", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${t.user_id} = ${authUid} OR public.is_admin()`,
    }),
  ],
);

// =============================================
// CLASS 댓글 테이블
// =============================================

export const classComments = pgTable(
  "class_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    class_id: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),

    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.profile_id, { onDelete: "cascade" }),

    // 대댓글
    parent_id: uuid("parent_id"),

    content: text("content").notNull(),

    is_deleted: boolean("is_deleted").notNull().default(false),

    ...timestamps,
  },

  (t) => [
    // =========================
    // self reference FK
    // =========================
    foreignKey({
      columns: [t.parent_id],
      foreignColumns: [t.id],
      name: "class_comments_parent_fk",
    }).onDelete("cascade"),

    // =========================
    // indexes
    // =========================
    index("class_comments_class_id_idx").on(t.class_id),
    index("class_comments_parent_id_idx").on(t.parent_id),
    index("class_comments_user_id_idx").on(t.user_id),

    // =========================
    // SELECT
    // =========================
    pgPolicy("select-class-comments", {
      for: "select",
      to: "public",
      as: "permissive",
      using: sql`
          ${t.is_deleted} = false
          AND EXISTS (
            SELECT 1
            FROM classes c
            WHERE c.id = ${t.class_id}
            AND c.is_deleted = false
            AND (
              c.is_published = true
              OR (
                ${authUid} IS NOT NULL
                AND EXISTS (
                  SELECT 1 FROM profiles p
                  WHERE p.profile_id = ${authUid}
                  AND p.role = 'admin'
                )
              )
            )
          )
        `,
    }),

    // =========================
    // INSERT
    // =========================
    pgPolicy("insert-class-comments", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`
          ${t.user_id} = ${authUid}
          AND EXISTS (
            SELECT 1
            FROM classes c
            WHERE c.id = ${t.class_id}
            AND c.is_deleted = false
            AND c.is_published = true
          )
        `,
    }),

    // =========================
    // UPDATE
    // =========================
    pgPolicy("update-class-comments", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${t.user_id} = ${authUid} OR public.is_admin()`,
      withCheck: sql`${t.user_id} = ${authUid} OR public.is_admin()`,
    }),

    // =========================
    // DELETE
    // =========================
    pgPolicy("delete-class-comments", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      // hard delete: 작성자/관리자/부모댓글 작성자까지 허용 (대댓글 CASCADE 삭제 대응)
      using: sql`public.can_delete_class_comment(${t.id})`,
    }),
  ],
);

// =============================================
// CLASS 댓글 좋아요 테이블
// =============================================

export const commentLikes = pgTable(
  "comment_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    comment_id: uuid("comment_id")
      .notNull()
      .references(() => classComments.id, { onDelete: "cascade" }),

    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.profile_id, { onDelete: "cascade" }),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("comment_likes_unique_user_comment").on(
      t.user_id,
      t.comment_id,
    ),
    index("comment_likes_comment_id_idx").on(t.comment_id),
    index("comment_likes_user_id_idx").on(t.user_id),

    // 공개 콘텐츠의 댓글 좋아요 수는 비로그인 사용자도 조회 가능
    pgPolicy("select-comment-likes", {
      for: "select",
      to: "public",
      as: "permissive",
      using: sql`true`, // 모든 댓글 좋아요 조회 가능 (개인정보 아님)
    }),

    pgPolicy("insert-comment-likes", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${t.user_id} = ${authUid}`,
    }),

    pgPolicy("delete-comment-likes", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${t.user_id} = ${authUid} OR public.is_admin()`,
    }),
  ],
);

// =============================================
// CLASS 조회 이벤트 테이블
// =============================================

export const classViewEvents = pgTable(
  "class_view_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    class_id: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),

    // 로그인 유저면 user_id, 아니면 null (anon도 기록 가능하게 확장)
    user_id: uuid("user_id").references(() => profiles.profile_id, {
      onDelete: "set null",
    }),

    // anon 추적용 (선택) - 나중에 쿠키/세션ID 같은 거 넣을 때 사용
    anon_id: text("anon_id"),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("class_view_events_class_id_idx").on(t.class_id),
    index("class_view_events_user_id_idx").on(t.user_id),
    index("class_view_events_created_at_idx").on(t.created_at),

    // 조회 로그는 기본적으로 "운영자만" 보게 하는 게 좋음 (개인정보/행동로그)
    pgPolicy("select-class-view-events-admin-only", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`public.is_admin()`,
    }),

    // insert는:
    // - 로그인 유저는 user_id = auth.uid 강제
    // - anon도 조회 이벤트 기록 가능 (user_id는 null)
    pgPolicy("insert-class-view-events-auth", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${t.user_id} = ${authUid}`,
    }),
    pgPolicy("insert-class-view-events-anon", {
      for: "insert",
      to: "anon",
      as: "permissive",
      withCheck: sql`${t.user_id} IS NULL`, // anon은 user_id가 null이어야 함
    }),
  ],
);

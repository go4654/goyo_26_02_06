import type { Route } from "../+types/admin-comments";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import type { CommentEntityType } from "../lib/get-content-path";

/**
 * 관리자 댓글 관리 테이블 행 데이터 타입
 */
export interface AdminCommentRow {
  id: string;
  content: string;
  className: string;
  classSlug: string;
  /** 행 클릭 시 이동할 콘텐츠 타입 */
  entityType: CommentEntityType;
  /** 행 클릭 시 이동할 콘텐츠 slug (향후 news/gallery 확장용) */
  entitySlug: string;
  userName: string;
  userId: string;
  isVisible: boolean;
  isDeleted: boolean;
  likesCount: number;
  createdAt: string;
  parentId: string | null;
}

/**
 * 댓글 목록 로더 (관리자 전용)
 *
 * - class_comments와 classes, profiles JOIN
 * - 모든 댓글 조회 (is_visible=false 포함)
 * - 최신순 정렬
 */
export async function commentsLoader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  // 댓글, 클래스, 프로필, 좋아요 수 조회
  const { data: commentsData, error: commentsError } = await client
    .from("class_comments")
    .select(
      `
      id,
      content,
      is_visible,
      is_deleted,
      created_at,
      parent_id,
      user_id,
      class_id,
      classes!inner(title, slug),
      profiles!inner(name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (commentsError) {
    throw new Response("댓글 목록 조회에 실패했습니다.", { status: 500 });
  }

  // 댓글 ID 목록 추출
  const commentIds = (commentsData || []).map((c) => c.id);

  // 좋아요 수 조회
  const { data: likesData } = await client
    .from("comment_likes")
    .select("comment_id")
    .in("comment_id", commentIds);

  // 댓글별 좋아요 수 맵
  const likesCountMap = new Map<string, number>();
  (likesData || []).forEach((like) => {
    const commentId = like.comment_id;
    likesCountMap.set(commentId, (likesCountMap.get(commentId) || 0) + 1);
  });

  const rows: AdminCommentRow[] = (commentsData || []).map((row) => {
    const slug = (row.classes as { slug?: string })?.slug ?? "";
    return {
      id: row.id,
      content: row.content,
      className: (row.classes as { title?: string })?.title ?? "-",
      classSlug: slug,
      entityType: "class" as const,
      entitySlug: slug,
      userName: (row.profiles as { name?: string })?.name ?? "-",
      userId: row.user_id,
      isVisible: row.is_visible,
      isDeleted: row.is_deleted,
      likesCount: likesCountMap.get(row.id) || 0,
      createdAt: row.created_at,
      parentId: row.parent_id,
    };
  });

  return { rows };
}

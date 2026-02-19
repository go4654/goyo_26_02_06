import type { CommentWithProfile } from "../queries";

/** 댓글 정렬 기준 */
export type CommentSortOrder = "latest" | "popular";

/** 정렬 옵션 라벨 */
export const COMMENT_SORT_LABELS: Record<CommentSortOrder, string> = {
  latest: "최신순",
  popular: "인기순",
};

/**
 * 최상위 댓글만 정렬한 뒤, 대댓글은 원본 순서로 이어붙여 목록에 전달하기 위한 배열을 반환합니다.
 * CommentList는 parent_id === null인 순서대로 상단에 노출하므로, 최상위만 정렬하면 됩니다.
 */
export function sortCommentsForDisplay(
  comments: CommentWithProfile[],
  order: CommentSortOrder,
): CommentWithProfile[] {
  const topLevel = comments.filter((c) => c.parent_id === null);
  const replies = comments.filter((c) => c.parent_id !== null);

  const sortedTopLevel =
    order === "latest"
      ? [...topLevel].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
      : [...topLevel].sort(
          (a, b) => b.likes_count - a.likes_count ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

  return [...sortedTopLevel, ...replies];
}

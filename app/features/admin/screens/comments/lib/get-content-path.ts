/**
 * 댓글이 달린 콘텐츠(클래스/뉴스/갤러리) 상세 페이지 경로 반환
 * 행 클릭 시 해당 콘텐츠 페이지로 이동할 때 사용
 */
export type CommentEntityType = "class" | "news" | "gallery";

export function getContentPathForComment(
  entityType: CommentEntityType,
  slug: string,
): string {
  if (!slug?.trim()) return "#";
  const encoded = encodeURIComponent(slug.trim());
  switch (entityType) {
    case "class":
      return `/class/${encoded}`;
    case "news":
      return `/news/${encoded}`;
    case "gallery":
      return `/gallery/${encoded}`;
    default:
      return "#";
  }
}

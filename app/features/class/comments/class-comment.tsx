import { ArrowUpDown } from "lucide-react";

import { Badge } from "~/core/components/ui/badge";

import { type CommentWithProfile } from "../queries";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

interface ClassCommentProps {
  /** 클래스 ID */
  classId: string;
  /** 댓글 목록 */
  comments: CommentWithProfile[];
  /** 현재 사용자 ID (권한 확인용) */
  currentUserId?: string | null;
  /** 관리자 여부 */
  isAdmin?: boolean;
}

/**
 * 클래스 댓글 컴포넌트
 *
 * 댓글 작성, 조회, 수정, 삭제 기능을 제공합니다.
 * 실제 데이터베이스의 댓글 데이터를 표시합니다.
 */
export default function ClassComment({
  classId,
  comments,
  currentUserId,
  isAdmin = false,
}: ClassCommentProps) {
  // 최상위 댓글만 필터링 (대댓글 제외)
  const topLevelComments = comments.filter(
    (comment) => comment.parent_id === null,
  );

  return (
    <>
      {/* 댓글 */}
      <div className="mt-26">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="xl:text-h6">댓글</h2>
            <Badge className="mt-1">{topLevelComments.length}</Badge>
          </div>

          <div className="text-text-3 flex cursor-pointer items-center gap-2 text-base">
            <span className="text-sm xl:text-base">최신순</span>{" "}
            <ArrowUpDown className="size-4 xl:size-5" />
          </div>
        </div>

        {/* 댓글 작성 폼 */}
        <CommentForm classId={classId} />

        {/* 댓글 목록 */}
        <CommentList
          comments={comments}
          classId={classId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      </div>
    </>
  );
}

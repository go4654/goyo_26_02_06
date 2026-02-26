import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";

import { type CommentWithProfile } from "../queries";
import { type CommentData, CommentItem } from "./comment-item";
import { ReplyForm } from "./reply-form";

interface CommentListProps {
  /** 댓글 목록 (최상위 댓글과 대댓글 모두 포함) */
  comments: CommentWithProfile[];
  /** 클래스 ID */
  classId: string;
  /** 현재 사용자 ID (권한 확인용) */
  currentUserId?: string | null;
  /** 관리자 여부 */
  isAdmin?: boolean;
  /** 댓글 삭제 성공 시 상위 상태 업데이트 콜백 */
  onDeleteSuccess?: (commentId: string, parentId: string | null) => void;
}

/**
 * 댓글 목록 컴포넌트
 *
 * 최상위 댓글과 대댓글을 계층 구조로 표시합니다.
 * 실제 데이터베이스의 댓글 데이터를 사용합니다.
 */
export function CommentList({
  comments,
  classId,
  currentUserId,
  isAdmin = false,
  onDeleteSuccess,
}: CommentListProps) {
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<
    Record<string, boolean>
  >({});

  const navigation = useNavigation();
  const prevNavigationState = useRef(navigation.state);

  // 폼 제출 완료 후 열려 있던 대댓글 폼 닫기
  // redirect 시 흐름: submitting → loading → idle 이므로, idle로 돌아올 때 이전이 submitting 또는 loading이면 닫기
  useEffect(() => {
    const prev = prevNavigationState.current;
    prevNavigationState.current = navigation.state;

    if (
      navigation.state === "idle" &&
      (prev === "submitting" || prev === "loading")
    ) {
      setReplyingToId(null);
    }
  }, [navigation.state]);

  // 최상위 댓글만 필터링
  const topLevelComments = comments
    .filter((comment) => comment.parent_id === null)
    .map(convertToCommentData);

  // 대댓글을 부모 ID별로 그룹화
  const repliesByParentId = comments
    .filter((comment) => comment.parent_id !== null)
    .reduce<Record<string, CommentData[]>>((acc, item) => {
      if (!item.parent_id) return acc;

      const parentId = item.parent_id;
      if (!acc[parentId]) acc[parentId] = [];
      acc[parentId].push(convertToCommentData(item));

      return acc;
    }, {});

  return (
    <div className="mt-10 space-y-8">
      {/* 댓글 목록 */}
      {topLevelComments.map((comment) => {
        const replies = repliesByParentId[comment.id] ?? [];
        const hasReplyToggle = replies.length > 1;
        const isExpanded = expandedReplies[comment.id] ?? false;
        const visibleReplies = hasReplyToggle && !isExpanded ? [] : replies;
        const isReplyFormOpen = replyingToId === comment.id;

        return (
          <CommentItem
            key={comment.id}
            comment={comment}
            classId={classId}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onDeleteSuccess={onDeleteSuccess}
            onReplyClick={() =>
              setReplyingToId((current) =>
                current === comment.id ? null : comment.id,
              )
            }
            replyCount={replies.length}
            isRepliesExpanded={isExpanded}
            onToggleReplies={
              hasReplyToggle
                ? () =>
                    setExpandedReplies((current) => ({
                      ...current,
                      [comment.id]: !isExpanded,
                    }))
                : undefined
            }
          >
            {visibleReplies.length > 0 && (
              <div className="mt-2 space-y-6">
                {visibleReplies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    isReply
                    classId={classId}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onDeleteSuccess={onDeleteSuccess}
                  />
                ))}
              </div>
            )}

            {isReplyFormOpen && (
              <ReplyForm parentId={comment.id} classId={classId} />
            )}
          </CommentItem>
        );
      })}
    </div>
  );
}

/**
 * CommentWithProfile을 CommentData로 변환
 *
 * 데이터베이스에서 가져온 댓글 데이터를 UI 컴포넌트에서 사용하는 형식으로 변환합니다.
 */
function convertToCommentData(comment: CommentWithProfile): CommentData {
  return {
    id: comment.id,
    parentId: comment.parent_id,
    content: comment.content,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    userId: comment.user_id,
    userName: comment.profile?.name || "익명",
    userProfileImage: comment.profile?.avatar_url || null,
    likes: comment.likes_count,
    isLiked: comment.is_liked,
    isVisible: comment.is_visible,
  };
}

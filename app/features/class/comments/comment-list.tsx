import { useState } from "react";

import { COMMENT_MOCKUP } from "../constants/comment.mockup";
import { type CommentData, CommentItem } from "./comment-item";
import { ReplyForm } from "./reply-form";

export function CommentList() {
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<
    Record<number, boolean>
  >({});

  const topLevelComments = COMMENT_MOCKUP.filter(
    (comment) => comment.parentId == null,
  ) as CommentData[];

  const repliesByParentId = COMMENT_MOCKUP.reduce<
    Record<number, CommentData[]>
  >((acc, item) => {
    if (item.parentId == null) return acc;

    const parentId = item.parentId;
    if (!acc[parentId]) acc[parentId] = [];
    acc[parentId].push(item as CommentData);

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
              <div className="mt-6 space-y-6">
                {visibleReplies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} isReply />
                ))}
              </div>
            )}

            {isReplyFormOpen && <ReplyForm parentId={comment.id} />}
          </CommentItem>
        );
      })}
    </div>
  );
}

import { ArrowUpDown, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";

import { COMMENTS_PAGE_SIZE } from "../constants/comment.constants";
import { type CommentWithProfile } from "../queries";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";
import { COMMENT_SORT_LABELS, type CommentSortOrder } from "./comment-sort";

/** 댓글 더보기 API 응답 */
interface CommentsPageResponse {
  comments: CommentWithProfile[];
  totalTopLevel: number;
}

interface ClassCommentProps {
  /** 클래스 ID */
  classId: string;
  /** 초기 댓글 목록 (로더 첫 페이지) */
  comments: CommentWithProfile[];
  /** 전체 최상위 댓글 수 (페이지네이션용) */
  totalTopLevelComments: number;
  /** 현재 사용자 ID (권한 확인용) */
  currentUserId?: string | null;
  /** 관리자 여부 */
  isAdmin?: boolean;
}

/**
 * 클래스 댓글 컴포넌트
 *
 * 댓글 작성, 조회, 수정, 삭제, 최신순/인기순 정렬, 더보기 페이지네이션을 제공합니다.
 * 최상위 댓글 기준으로 10개씩 로드하며, 대댓글은 각 부모와 함께 유지됩니다.
 */
export default function ClassComment({
  classId,
  comments: initialComments,
  totalTopLevelComments: initialTotal,
  currentUserId,
  isAdmin = false,
}: ClassCommentProps) {
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>("latest");
  const [accumulatedComments, setAccumulatedComments] =
    useState<CommentWithProfile[]>(initialComments);
  const [totalTopLevel, setTotalTopLevel] = useState(initialTotal);
  const replaceOnNextData = useRef(false);

  const fetcher = useFetcher<CommentsPageResponse>();

  // 로더 리밸리데이션 시 초기 상태로 동기화
  useEffect(() => {
    setAccumulatedComments(initialComments);
    setTotalTopLevel(initialTotal);
  }, [initialComments, initialTotal]);

  // 더보기/정렬 API 응답 처리
  useEffect(() => {
    const data = fetcher.data;
    if (!data) return;

    if (replaceOnNextData.current) {
      setAccumulatedComments(data.comments);
      replaceOnNextData.current = false;
    } else {
      setAccumulatedComments((prev) => [...prev, ...data.comments]);
    }
    setTotalTopLevel(data.totalTopLevel);
  }, [fetcher.data]);

  const loadedTopCount = accumulatedComments.filter(
    (c) => c.parent_id === null,
  ).length;
  const hasMore = loadedTopCount < totalTopLevel;

  // 새 댓글 낙관적 추가
  const handleOptimisticCreate = (content: string) => {
    if (!currentUserId) return;

    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const optimisticComment: CommentWithProfile = {
      id: tempId,
      class_id: classId,
      user_id: currentUserId,
      parent_id: null,
      content,
      created_at: now,
      updated_at: now,
      is_visible: true,
      profile: {
        profile_id: currentUserId,
        name: "나",
        avatar_url: null,
        role: isAdmin ? "admin" : undefined,
      },
      likes_count: 0,
      is_liked: false,
    };

    setAccumulatedComments((prev) => [optimisticComment, ...prev]);
    setTotalTopLevel((prev) => prev + 1);
  };

  // 댓글 삭제 후 로컬 상태에서 제거 (대댓글 포함)
  const handleDeleteSuccess = (deletedId: string, parentId: string | null) => {
    setAccumulatedComments((prev) =>
      prev.filter((c) => {
        if (c.id === deletedId) return false;
        // 최상위 댓글 삭제 시, 그 댓글에 달린 대댓글도 함께 제거
        if (parentId === null && c.parent_id === deletedId) return false;
        return true;
      }),
    );

    if (parentId === null) {
      setTotalTopLevel((prev) => Math.max(0, prev - 1));
    }
  };

  const handleSortChange = (newOrder: CommentSortOrder) => {
    if (newOrder === sortOrder) return;
    setSortOrder(newOrder);
    replaceOnNextData.current = true;
    fetcher.load(
      `/api/class/comments?classId=${classId}&offset=0&limit=${COMMENTS_PAGE_SIZE}&sortOrder=${newOrder}`,
    );
  };

  const handleLoadMore = () => {
    replaceOnNextData.current = false;
    fetcher.load(
      `/api/class/comments?classId=${classId}&offset=${loadedTopCount}&limit=${COMMENTS_PAGE_SIZE}&sortOrder=${sortOrder}`,
    );
  };

  return (
    <>
      <div className="mt-26">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="xl:text-h6">댓글</h2>
            <Badge className="mt-1">{totalTopLevel}</Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-text-3 flex cursor-pointer items-center gap-2 text-base"
              >
                <span className="text-sm xl:text-base">
                  {COMMENT_SORT_LABELS[sortOrder]}
                </span>
                <ArrowUpDown className="size-4 xl:size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleSortChange("latest")}
                className="cursor-pointer"
              >
                {COMMENT_SORT_LABELS.latest}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSortChange("popular")}
                className="cursor-pointer"
              >
                {COMMENT_SORT_LABELS.popular}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CommentForm
          classId={classId}
          onOptimisticCreate={handleOptimisticCreate}
        />

        <CommentList
          comments={accumulatedComments}
          classId={classId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onDeleteSuccess={handleDeleteSuccess}
        />

        {hasMore && (
          <div className="mt-10 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleLoadMore}
              disabled={fetcher.state !== "idle"}
              className="border-primary text-primary hover:bg-primary/10 cursor-pointer"
            >
              {fetcher.state === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "댓글 더보기"
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

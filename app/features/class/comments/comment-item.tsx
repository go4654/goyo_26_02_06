import {
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  MessageCircle,
  Moon,
  Pencil,
  ThumbsUp,
  Trash,
} from "lucide-react";
import { DateTime } from "luxon";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { z } from "zod";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { Textarea } from "~/core/components/ui/textarea";

/**
 * 댓글 데이터 타입
 * 실제 데이터베이스 구조에 맞춘 타입
 */
export interface CommentData {
  id: string;
  parentId?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  userProfileImage: string | null;
  likes: number;
  isLiked?: boolean; // 현재 사용자가 좋아요를 눌렀는지 여부
  role?: string; // 작성자 역할 (admin일 때 뱃지 표시)
}

interface CommentItemProps {
  comment: CommentData;
  isReply?: boolean;
  children?: ReactNode;
  onReplyClick?: () => void;
  replyCount?: number;
  isRepliesExpanded?: boolean;
  onToggleReplies?: () => void;
  /** 클래스 ID (수정/삭제 액션용) */
  classId?: string;
  /** 현재 사용자 ID (본인 댓글 확인용) */
  currentUserId?: string | null;
  /** 관리자 여부 */
  isAdmin?: boolean;
}

export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "댓글을 입력해주세요.")
    .max(1000, "댓글은 1,000자 이하로 작성해주세요."),
});

export type CommentFormValues = z.infer<typeof commentSchema>;

/**
 * @언급 패턴(@ 뒤에 공백 아닌 문자)을 파란색으로 표시
 * 링크 등 특별 기능 없이 색상만 적용
 */
function renderContentWithMentions(text: string): ReactNode {
  const parts = text.split(/(@\S+)/g);
  return parts.map((part, i) =>
    /^@\S+$/.test(part) ? (
      <span key={i} className="text-blue-500">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/**
 * ISO 날짜를 한국 시간으로 변환하여 상대 시간 표시
 * Luxon을 사용하여 한국 시간대(Asia/Seoul)로 변환
 *
 * DB에서 가져온 시간은 UTC일 수 있으므로, UTC로 파싱한 후 한국 시간대로 변환합니다.
 */
function formatRelativeDate(isoDate: string) {
  // UTC로 파싱한 후 한국 시간대로 변환 (DB 시간이 UTC로 저장되어 있을 수 있음)
  let date = DateTime.fromISO(isoDate, { zone: "utc" });

  // UTC 파싱 실패 시 기본 파싱 시도
  if (!date.isValid) {
    date = DateTime.fromISO(isoDate);
  }

  // 한국 시간대로 변환
  date = date.setZone("Asia/Seoul");

  if (!date.isValid) return isoDate;

  const now = DateTime.now().setZone("Asia/Seoul");
  const diff = now
    .diff(date, ["days", "hours", "minutes", "seconds"])
    .toObject();

  const days = diff.days ?? 0;
  const hours = diff.hours ?? 0;
  const minutes = diff.minutes ?? 0;
  const seconds = diff.seconds ?? 0;

  if (days < 1) {
    if (hours < 1) {
      if (minutes < 1) {
        // 1분 미만은 "방금 전"으로 표시
        if (seconds < 10) return "방금 전";
        return `${Math.floor(seconds)}초 전`;
      }
      return `${Math.floor(minutes)}분 전`;
    }
    return `${Math.floor(hours)}시간 전`;
  }

  if (days < 7) {
    return `${Math.floor(days)}일 전`;
  }

  // 7일 이상 지난 경우 한국 시간으로 날짜 표시
  return date.toFormat("yyyy.MM.dd HH:mm");
}

export function CommentItem({
  comment,
  isReply = false,
  children,
  onReplyClick,
  replyCount,
  isRepliesExpanded,
  onToggleReplies,
  classId,
  currentUserId,
  isAdmin = false,
}: CommentItemProps) {
  const [value, setValue] = useState(comment.content);
  const [draft, setDraft] = useState(comment.content);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes ?? 0);
  const [liked, setLiked] = useState(comment.isLiked ?? false);
  const fetcher = useFetcher();
  const likeFetcher = useFetcher<{ success: boolean; isLiked: boolean }>();
  const prevFetcherState = useRef(fetcher.state);

  // 본인 댓글 또는 관리자 여부 확인 (수정/삭제 권한)
  const isOwnComment = currentUserId === comment.userId;
  const canModify = isOwnComment || isAdmin;

  const handleEditClick = () => {
    setDraft(value);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleEditSave = () => {
    if (!classId) return;

    // 서버 액션으로 댓글 수정
    fetcher.submit(
      {
        action: "update",
        commentId: comment.id,
        classId,
        content: draft,
      },
      { method: "post" },
    );
  };

  // 수정 제출 후 편집 모드 닫기 (redirect 시 submitting → loading → idle 이므로 둘 다 처리)
  useEffect(() => {
    const prev = prevFetcherState.current;
    prevFetcherState.current = fetcher.state;

    const justFinished =
      (prev === "submitting" || prev === "loading") && fetcher.state === "idle";
    if (!justFinished) return;

    const hasError = fetcher.data && (fetcher.data as { error?: string }).error;
    if (!hasError) {
      setValue(draft);
      setIsEditing(false);
    }
  }, [fetcher.state, fetcher.data, draft]);

  const handleLikeClick = () => {
    if (!classId || !currentUserId) return;

    // 낙관적 업데이트 (즉시 UI 반영)
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    // 서버 액션으로 좋아요 토글
    likeFetcher.submit(
      {
        action: "toggleLike",
        commentId: comment.id,
        classId,
      },
      { method: "post" },
    );
  };

  // 좋아요 액션 결과 처리 (서버 응답과 동기화)
  useEffect(() => {
    const data = likeFetcher.data;
    if (
      likeFetcher.state === "idle" &&
      data &&
      data.success &&
      typeof data.isLiked === "boolean"
    ) {
      const newIsLiked = data.isLiked;
      setLiked(newIsLiked);
      setLikeCount((prev) => {
        if (liked !== newIsLiked) {
          return newIsLiked ? prev + 1 : prev - 1;
        }
        return prev;
      });
    }
  }, [likeFetcher.state, likeFetcher.data, liked]);

  const handleDelete = () => {
    if (!classId) return;

    // 서버 액션으로 댓글 삭제
    fetcher.submit(
      {
        action: "delete",
        commentId: comment.id,
        classId,
      },
      { method: "post" },
    );

    setIsDeleteOpen(false);
  };

  const avatarSizeClass = isReply
    ? "w-6 h-6 xl:h-8 xl:w-8"
    : "h-8 w-8 xl:h-10 xl:w-10";
  const containerGapClass = isReply ? "gap-2 xl:gap-4" : "gap-2 xl:gap-6";

  return (
    <div className={`flex items-start ${containerGapClass}`}>
      {/* 아바타 */}
      <Avatar className={avatarSizeClass}>
        <AvatarImage src={comment.userProfileImage ?? undefined} />
        <AvatarFallback className="text-xs xl:text-sm">
          {comment.userName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="mt-0.5 flex w-full flex-col gap-1">
        {/* 유저 정보 및 댓글 수정, 삭제 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 유저 이름 */}
            <span className="text-text-2 text-sm">@{comment.userName}</span>
            {/* 관리자 뱃지 */}
            {comment.role === "admin" && (
              <Badge variant="default" className="text-xs">
                <Moon className="size-3" /> <span>고요</span>
              </Badge>
            )}
            {/* 댓글 작성 시간 */}
            <span className="text-text-3/50 text-sm">
              {formatRelativeDate(comment.createdAt)}
            </span>
          </div>

          {/* 본인 댓글이거나 관리자일 때 수정/삭제 메뉴 표시 */}
          {canModify && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="text-text-2 cursor-pointer">
                  <EllipsisVertical size={16} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-2">
                {/* 본인 댓글만 수정 가능 */}
                {isOwnComment && (
                  <DropdownMenuItem
                    className="mb-2 flex cursor-pointer items-center gap-2"
                    onSelect={(event) => {
                      event.preventDefault();
                      handleEditClick();
                    }}
                  >
                    <Pencil className="text-text-2 size-4" /> <span> 수정</span>
                  </DropdownMenuItem>
                )}

                {/* 본인 댓글 또는 관리자는 삭제 가능 */}
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2"
                  onSelect={(event) => {
                    event.preventDefault();
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash className="text-text-2 size-4" />{" "}
                  <span className="text-text-2"> 삭제</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* 수정 폼 또는 댓글 내용 */}
        {isEditing ? (
          <div className="mt-1 flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[120px]"
              disabled={fetcher.state === "submitting"}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEditCancel}
                disabled={fetcher.state === "submitting"}
              >
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleEditSave}
                disabled={fetcher.state === "submitting" || !draft.trim()}
              >
                {fetcher.state === "submitting" ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* 댓글 내용 (@언급은 파란색 표시) */}
            <p className="text-base whitespace-pre-line">
              {renderContentWithMentions(value)}
            </p>
            {/* 좋아요, 댓글 달기, 답글 더보기 버튼 */}
            <div className="mt-2 flex items-center gap-6">
              <button
                type="button"
                className={`group hover:text-primary flex cursor-pointer items-center gap-1 ${
                  liked ? "text-white" : "text-text-2"
                } text-sm xl:text-base`}
                onClick={handleLikeClick}
              >
                <ThumbsUp
                  className="group-hover:text-primary size-3 xl:size-4"
                  fill={liked ? "currentColor" : "none"}
                />
                <span className="group-hover:text-primary text-sm xl:text-base">
                  {likeCount}
                </span>
              </button>

              {!isReply && (
                <div className="group flex items-center gap-4">
                  <button
                    type="button"
                    className="text-text-2 group-hover:text-primary flex cursor-pointer items-center gap-1 text-sm xl:text-base"
                    onClick={onReplyClick}
                  >
                    <MessageCircle className="size-3 xl:size-4" />
                    <span className="group-hover:text-primary text-sm xl:text-base">
                      답글
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 답글 숨기기, 보기 버튼 */}
            <div className="mt-4">
              {replyCount !== undefined && replyCount > 1 && (
                <button
                  type="button"
                  className="text-text-2 text-sm underline-offset-2 hover:underline xl:text-base"
                  onClick={onToggleReplies}
                >
                  {isRepliesExpanded ? (
                    <div className="flex items-center gap-1 text-sm xl:text-base">
                      답글 숨기기 <ChevronUp size={16} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm xl:text-base">
                      답글 {replyCount}개 보기 <ChevronDown size={16} />
                    </div>
                  )}
                </button>
              )}
            </div>
          </>
        )}

        {/* 삭제 댓글 확인 다이얼로그 */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>댓글을 삭제할까요?</DialogTitle>
              <DialogDescription>
                삭제 후에는 되돌릴 수 없습니다. 계속 진행하시겠어요?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  취소
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={fetcher.state === "submitting"}
                >
                  {fetcher.state === "submitting" ? "삭제 중..." : "삭제"}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 대댓글 및 하위 콘텐츠 (답글 폼 포함) */}
        {children}
      </div>
    </div>
  );
}

import {
  ChevronDown,
  EllipsisVertical,
  MessageCircle,
  Pencil,
  ThumbsUp,
  Trash,
} from "lucide-react";
import { DateTime } from "luxon";
import { type ReactNode, useState } from "react";
import { z } from "zod";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
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

export interface CommentData {
  id: number;
  parentId?: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userName: string;
  userProfileImage: string;
  likes: number;
}

interface CommentItemProps {
  comment: CommentData;
  isReply?: boolean;
  children?: ReactNode;
  onReplyClick?: () => void;
  replyCount?: number;
  isRepliesExpanded?: boolean;
  onToggleReplies?: () => void;
}

export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "댓글을 입력해주세요.")
    .max(1000, "댓글은 1,000자 이하로 작성해주세요."),
});

export type CommentFormValues = z.infer<typeof commentSchema>;

function formatRelativeDate(isoDate: string) {
  const date = DateTime.fromISO(isoDate);
  if (!date.isValid) return isoDate;

  const now = DateTime.now();
  const diff = now.diff(date, ["days", "hours"]).toObject();

  const days = diff.days ?? 0;
  const hours = diff.hours ?? 0;

  if (days < 1) {
    if (hours < 1) return "방금 전";
    return `${Math.floor(hours)}시간 전`;
  }

  if (days < 7) {
    return `${Math.floor(days)}일 전`;
  }

  return date.toFormat("yyyy.MM.dd");
}

export function CommentItem({
  comment,
  isReply = false,
  children,
  onReplyClick,
  replyCount,
  isRepliesExpanded,
  onToggleReplies,
}: CommentItemProps) {
  const [value, setValue] = useState(comment.content);
  const [draft, setDraft] = useState(comment.content);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes ?? 0);
  const [liked, setLiked] = useState(false);

  const handleEditClick = () => {
    setDraft(value);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleEditSave = () => {
    setValue(draft);
    setIsEditing(false);
  };

  const handleLikeClick = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const avatarSizeClass = isReply
    ? "w-6 h-6 xl:h-8 xl:w-8"
    : "h-8 w-8 xl:h-10 xl:w-10";
  const containerGapClass = isReply ? "gap-2 xl:gap-4" : "gap-2 xl:gap-6";

  return (
    <div className={`flex items-start ${containerGapClass}`}>
      {/* 아바타 */}
      <Avatar className={avatarSizeClass}>
        <AvatarImage src={comment.userProfileImage} />
        <AvatarFallback className="text-sm">
          {comment.userName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="mt-0.5 flex w-full flex-col gap-1">
        {/* 유저 정보 및 댓글 수정, 삭제 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 유저 이름 */}
            <span className="text-text-2 text-sm xl:text-base">
              {comment.userName}
            </span>
            {/* 댓글 작성 시간 */}
            <span className="text-text-3/50 text-sm xl:text-base">
              {formatRelativeDate(comment.createdAt)}
            </span>
          </div>

          {/* TODO: 본인 댓글일 때만 노출 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="text-text-2 cursor-pointer">
                <EllipsisVertical size={16} />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2">
              <DropdownMenuItem
                className="mb-2 flex cursor-pointer items-center gap-2"
                onSelect={(event) => {
                  event.preventDefault();
                  handleEditClick();
                }}
              >
                <Pencil className="text-text-2 size-4" /> <span> 수정</span>
              </DropdownMenuItem>

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
        </div>

        {/* 수정 폼 또는 댓글 내용 */}
        {isEditing ? (
          <div className="mt-1 flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEditCancel}
              >
                취소
              </Button>
              <Button type="button" size="sm" onClick={handleEditSave}>
                저장
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* 댓글 내용 */}
            <p className="text-base whitespace-pre-line">{value}</p>
            {/* 좋아요, 댓글 달기, 답글 더보기 버튼 */}
            <div className="mt-4 flex items-center gap-6">
              <button
                type="button"
                className={`flex cursor-pointer items-center gap-1 ${
                  liked ? "text-primary" : "text-text-2"
                }`}
                onClick={handleLikeClick}
              >
                <ThumbsUp size={16} />
                <span>{likeCount}</span>
              </button>

              {!isReply && (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="text-text-2 flex cursor-pointer items-center gap-1"
                    onClick={onReplyClick}
                  >
                    <MessageCircle size={16} />
                    <span>답글</span>
                  </button>
                </div>
              )}
            </div>

            {/* 답글 숨기기, 보기 버튼 */}
            <div className="mt-4">
              {replyCount !== undefined && replyCount > 1 && (
                <button
                  type="button"
                  className="text-text-2 text-sm underline-offset-2 hover:underline"
                  onClick={onToggleReplies}
                >
                  {isRepliesExpanded ? (
                    "답글 숨기기"
                  ) : (
                    <div className="flex items-center gap-1">
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
                  onClick={() => {
                    // TODO: 서버 연동 시 실제 삭제 처리
                    setIsEditing(false);
                  }}
                >
                  삭제
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

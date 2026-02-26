import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";

import { type CommentFormValues, commentSchema } from "./comment-item";

interface CommentFormProps {
  /** 클래스 ID */
  classId: string;
  /** 낙관적 댓글 추가 콜백 (선택) */
  onOptimisticCreate?: (content: string) => void;
}

/**
 * 댓글 작성 폼 컴포넌트
 *
 * 새로운 댓글을 작성하는 폼입니다.
 * 서버 액션을 통해 실제 데이터베이스에 저장됩니다.
 */
export function CommentForm({ classId, onOptimisticCreate }: CommentFormProps) {
  const [newComment, setNewComment] = useState("");
  const [newCommentError, setNewCommentError] = useState<string | null>(null);
  const navigation = useNavigation();
  const actionData = useActionData<{ error?: string; success?: boolean }>();
  const isSubmitting = navigation.state === "submitting";

  // 제출 완료 후 폼 초기화 (리다이렉트되면 자동으로 처리되지만, 에러 시를 대비)
  useEffect(() => {
    if (navigation.state === "idle" && newComment && !actionData?.error) {
      // 제출이 완료되고 에러가 없으면 폼 초기화
      setNewComment("");
      setNewCommentError(null);
    }
  }, [navigation.state, actionData]);

  // 서버 액션 에러 처리
  useEffect(() => {
    if (actionData?.error) {
      setNewCommentError(actionData.error);
    }
  }, [actionData]);

  const handleNewCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // 클라이언트 사이드 검증
    const result = commentSchema.safeParse({
      content: newComment,
    } satisfies CommentFormValues);

    if (!result.success) {
      event.preventDefault();
      const message =
        result.error.issues[0]?.message ?? "유효하지 않은 댓글입니다.";
      setNewCommentError(message);
      return;
    }

    // 낙관적 UI: 서버로 제출하기 전에 상위 컴포넌트에 신규 댓글 내용 전달
    const trimmed = newComment.trim();
    if (trimmed) {
      onOptimisticCreate?.(trimmed);
    }

    // 서버 액션이 처리하므로 폼은 제출됨
    setNewCommentError(null);
    // 제출 후 입력 필드 초기화는 서버에서 리다이렉트되면 자동으로 처리됨
  };

  return (
    <Form method="post" onSubmit={handleNewCommentSubmit} className="space-y-2">
      {/* 액션 타입 */}
      <input type="hidden" name="action" value="create" />
      {/* 클래스 ID */}
      <input type="hidden" name="classId" value={classId} />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            name="content"
            placeholder="댓글을 입력해주세요."
            className="h-12 rounded-2xl"
            value={newComment}
            onChange={(event) => {
              setNewComment(event.target.value);
              // 입력 시 에러 초기화
              if (newCommentError) {
                setNewCommentError(null);
              }
            }}
            disabled={isSubmitting}
            aria-invalid={newCommentError ? true : undefined}
            onKeyDown={(event) => {
              // Enter 키로 제출 (Shift+Enter는 줄바꿈)
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (newComment.trim() && !isSubmitting) {
                  (
                    event.currentTarget.form as HTMLFormElement
                  )?.requestSubmit();
                }
              }
            }}
          />
          {isSubmitting && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <div className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className={"h-12 rounded-2xl px-6"}
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "등록"}
        </Button>
      </div>
      {newCommentError && (
        <p className="text-destructive text-sm" role="alert">
          {newCommentError}
        </p>
      )}
    </Form>
  );
}

import { useState } from "react";
import { Form } from "react-router";

import { Input } from "~/core/components/ui/input";

import { commentSchema, type CommentFormValues } from "./comment-item";

export function CommentForm() {
  const [newComment, setNewComment] = useState("");
  const [newCommentError, setNewCommentError] = useState<string | null>(null);

  const handleNewCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = commentSchema.safeParse({
      content: newComment,
    } satisfies CommentFormValues);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ?? "유효하지 않은 댓글입니다.";
      setNewCommentError(message);
      return;
    }

    // TODO: 서버 연동 시 실제 댓글 생성 처리
    setNewCommentError(null);
    setNewComment("");
  };

  return (
    <Form
      method="post"
      onSubmit={handleNewCommentSubmit}
      className="space-y-2"
    >
      <Input
        type="text"
        name="comment"
        placeholder="댓글을 입력해주세요."
        className="h-[50px]"
        value={newComment}
        onChange={(event) => setNewComment(event.target.value)}
        aria-invalid={newCommentError ? true : undefined}
      />
      {newCommentError && (
        <p className="text-destructive text-sm" role="alert">
          {newCommentError}
        </p>
      )}
    </Form>
  );
}

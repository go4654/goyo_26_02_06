import { useState } from "react";

import { Button } from "~/core/components/ui/button";
import { Textarea } from "~/core/components/ui/textarea";

import { type CommentFormValues, commentSchema } from "./comment-item";

interface ReplyFormProps {
  parentId: number;
  onSubmitted?: () => void;
}

export function ReplyForm({ parentId, onSubmitted }: ReplyFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = commentSchema.safeParse({
      content: value,
    } satisfies CommentFormValues);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ?? "유효하지 않은 댓글입니다.";
      setError(message);
      return;
    }

    // TODO: 서버 연동 시 parentId와 함께 실제 대댓글 생성 처리
    setError(null);
    setValue("");
    onSubmitted?.();
  };

  return (
    <form className="mt-4 flex flex-col gap-2" onSubmit={handleSubmit}>
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="대댓글을 입력해주세요."
        className="min-h-[80px]"
        aria-invalid={error ? true : undefined}
      />
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!value.trim()}>
          등록
        </Button>
      </div>
    </form>
  );
}

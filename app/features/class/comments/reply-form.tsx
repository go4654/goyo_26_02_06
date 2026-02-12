import { useState } from "react";
import { Form, useNavigation } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Textarea } from "~/core/components/ui/textarea";

import { type CommentFormValues, commentSchema } from "./comment-item";

interface ReplyFormProps {
  /** 부모 댓글 ID */
  parentId: string;
  /** 클래스 ID */
  classId: string;
}

/**
 * 대댓글 작성 폼 컴포넌트
 *
 * 특정 댓글에 대한 대댓글을 작성하는 폼입니다.
 * 서버 액션을 통해 실제 데이터베이스에 저장됩니다.
 */
export function ReplyForm({
  parentId,
  classId,
}: ReplyFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // 클라이언트 사이드 검증
    const result = commentSchema.safeParse({
      content: value,
    } satisfies CommentFormValues);

    if (!result.success) {
      event.preventDefault();
      const message =
        result.error.issues[0]?.message ?? "유효하지 않은 댓글입니다.";
      setError(message);
      return;
    }

    // 서버 액션이 처리하므로 폼은 제출됨
    setError(null);
  };

  return (
    <Form
      method="post"
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-2"
    >
      {/* 액션 타입 */}
      <input type="hidden" name="action" value="create" />
      {/* 클래스 ID */}
      <input type="hidden" name="classId" value={classId} />
      {/* 부모 댓글 ID */}
      <input type="hidden" name="parentId" value={parentId} />

      <Textarea
        name="content"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          // 입력 시 에러 초기화
          if (error) {
            setError(null);
          }
        }}
        placeholder="대댓글을 입력해주세요."
        className="min-h-[80px]"
        disabled={isSubmitting}
        aria-invalid={error ? true : undefined}
      />
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!value.trim() || isSubmitting}>
          {isSubmitting ? "등록 중..." : "등록"}
        </Button>
      </div>
    </Form>
  );
}

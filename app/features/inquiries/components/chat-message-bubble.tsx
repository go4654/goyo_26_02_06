import { cn } from "~/core/lib/utils";

/**
 * 채팅 말풍선 (유저/관리자 공통)
 *
 * - isMine 여부로 좌/우 정렬 및 색상만 결정
 * - maxWidthClass로 화면별 최대 너비만 커스터마이즈
 */
export function ChatMessageBubble({
  content,
  createdAtLabel,
  isMine,
  maxWidthClass = "max-w-[85%]",
}: {
  content: string;
  createdAtLabel: string;
  isMine: boolean;
  maxWidthClass?: string;
}) {
  return (
    <div className="flex">
      <div
        className={cn(
          maxWidthClass,
          "rounded-lg px-4 py-3 text-sm whitespace-pre-wrap shadow-xs",
          isMine
            ? "bg-primary text-primary-foreground ml-auto"
            : "bg-muted text-foreground mr-auto",
        )}
      >
        <div className="break-words">{content}</div>
        <div
          className={cn(
            "mt-2 text-xs tabular-nums",
            isMine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {createdAtLabel}
        </div>
      </div>
    </div>
  );
}


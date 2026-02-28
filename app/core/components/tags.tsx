import { cn } from "../lib/utils";

export default function Tags({
  tags,
  borderColor = "border-text-3/50",
  maxVisible,
  showOverflowCount = false,
}: {
  tags: string[];
  /** 테두리 색상 클래스 (예: "border-primary") */
  borderColor?: string;
  /** 표시할 최대 태그 개수 (초과분은 +N으로 표시) */
  maxVisible?: number;
  /** 초과 태그 개수를 +N 형태로 표시할지 여부 */
  showOverflowCount?: boolean;
}) {
  const hasLimit = typeof maxVisible === "number" && maxVisible > 0;
  const visibleTags = hasLimit ? tags.slice(0, maxVisible) : tags;
  const overflowCount = hasLimit
    ? Math.max(0, tags.length - visibleTags.length)
    : 0;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1 xl:gap-2">
      {visibleTags.map((tag, index) => (
        <div
          className={cn(
            "text-text-3 rounded-full border px-2 py-1 text-xs",
            borderColor ?? "border-text-3/50",
          )}
          key={index}
        >
          {tag}
        </div>
      ))}

      {showOverflowCount && overflowCount > 0 && (
        <div
          className={cn(
            "text-text-3 rounded-full border px-2 py-1 text-xs",
            borderColor ?? "border-text-3/50",
          )}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}

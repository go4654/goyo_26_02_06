import { Badge } from "~/core/components/ui/badge";
import { cn } from "~/core/lib/utils";

/** 문의 상태 (스키마 inquiry_status enum과 동일) */
export type InquiryStatus = "pending" | "answered" | "closed";

const STATUS_LABELS: Record<InquiryStatus, string> = {
  pending: "대기중",
  answered: "답변완료",
  closed: "종료",
};

const STATUS_STYLES: Record<
  InquiryStatus,
  { variant: "outline" | "secondary"; className: string }
> = {
  pending: {
    variant: "outline",
    className:
      "bg-warning/15 text-warning border-warning/40 dark:bg-warning/20 dark:border-warning/50",
  },
  answered: {
    variant: "outline",
    className:
      "bg-success/15 text-success border-success/40 dark:bg-success/20 dark:border-success/50",
  },
  closed: {
    variant: "secondary",
    className: "",
  },
};

interface InquiryStatusBadgeProps {
  status: InquiryStatus;
  className?: string;
  /** true면 variant outline + 테두리 secondary (목록 등에서 사용) */
  outlineSecondary?: boolean;
}

/** 문의 상태 뱃지 (pending: 노랑 계열, answered: 초록 계열, closed: 회색) */
export function InquiryStatusBadge({
  status,
  className,
  outlineSecondary,
}: InquiryStatusBadgeProps) {
  const label = STATUS_LABELS[status];
  const { variant, className: statusClassName } = STATUS_STYLES[status];
  const effectiveVariant = outlineSecondary ? "outline" : variant;
  const effectiveClassName = outlineSecondary
    ? "border-secondary"
    : statusClassName;
  return (
    <Badge
      variant={effectiveVariant}
      className={cn(effectiveClassName, className)}
    >
      {label}
    </Badge>
  );
}

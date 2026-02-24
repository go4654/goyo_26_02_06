/**
 * 공지 배너 (헤더 위 고정)
 * - variant별 색상, X 닫기, localStorage로 유저별 닫기 유지
 * - noticeVersion별 키 사용으로 버전 변경 시 자동 재노출
 */
import { XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "~/core/components/ui/button";
import { cn } from "~/core/lib/utils";

export type NoticeVariant = "info" | "warning" | "event";

interface NoticeBannerProps {
  message: string;
  variant: NoticeVariant;
  noticeVersion: number;
  /** 닫기 시 호출 (헤더/스페이서를 top-0으로 갱신용) */
  onDismiss?: () => void;
}

const variantStyles: Record<
  NoticeVariant,
  { wrapper: string; button: string }
> = {
  info: {
    wrapper:
      "bg-blue-500/95 text-blue-950 dark:bg-blue-600/95 dark:text-blue-50",
    button: "hover:bg-blue-600/80 dark:hover:bg-blue-500/80",
  },
  warning: {
    wrapper:
      "bg-amber-500/95 text-amber-950 dark:bg-amber-600/95 dark:text-amber-50",
    button: "hover:bg-amber-600/80 dark:hover:bg-amber-500/80",
  },
  event: {
    wrapper:
      "bg-violet-500/95 text-violet-950 dark:bg-violet-600/95 dark:text-violet-50",
    button: "hover:bg-violet-600/80 dark:hover:bg-violet-500/80",
  },
};

export function NoticeBanner({
  message,
  variant,
  noticeVersion,
  onDismiss,
}: NoticeBannerProps) {
  const [dismissed, setDismissed] = useState(true);
  const storageKey = `notice_banner_dismissed_${noticeVersion}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey);
    setDismissed(saved === "true");
  }, [storageKey]);

  const handleDismiss = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey, "true");
    setDismissed(true);
    onDismiss?.();
  }, [storageKey, onDismiss]);

  if (dismissed) return null;

  const styles = variantStyles[variant];

  return (
    <div
      role="banner"
      className={cn(
        "fixed top-0 right-0 left-0 z-[60] flex h-12 w-full shrink-0 items-center justify-between gap-3 px-4 py-2.5 text-center text-sm backdrop-blur-sm",
        styles.wrapper,
      )}
    >
      {/* 메시지 */}
      <p className="min-w-0 flex-1 break-words">{message}</p>

      {/* 닫기 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="배너 닫기"
        className={cn("shrink-0 text-current opacity-90", styles.button)}
        onClick={handleDismiss}
      >
        <XIcon className="size-4" />
      </Button>
    </div>
  );
}

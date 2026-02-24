import type { InquiryDetailMessage } from "../server/inquiry-detail.loader";
import type { Route } from "./+types/inquiry-detail";

import { Loader2Icon, MoveLeft, SendIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useFetcher, useRevalidator } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Textarea } from "~/core/components/ui/textarea";
import { cn } from "~/core/lib/utils";

import { InquiryStatusBadge } from "../components/InquiryStatusBadge";
import { formatInquiryDate } from "../lib/format-inquiry-date";
import { mergeMessagesById } from "../lib/merge-messages";
import { INQUIRY_CATEGORY_LABELS } from "../lib/mock-inquiries";
import { inquiryDetailAction } from "../server/inquiry-detail.action";
import { inquiryDetailLoader } from "../server/inquiry-detail.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: `문의 상세 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = inquiryDetailLoader;
export const action = inquiryDetailAction;

/** 메시지 카드 1개 (티켓형, full width) */
function MessageCard({
  message,
  authorLabel,
}: {
  message: InquiryDetailMessage;
  authorLabel: string;
}) {
  const isAdmin = message.authorRole === "admin";
  return (
    <Card
      className={cn(
        isAdmin ? "border-primary bg-primary/20" : "bg-muted",
        "gap-0",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isAdmin ? "default" : "secondary"}>
            {isAdmin ? "관리자" : "회원"}
          </Badge>
          <span className="text-sm font-medium">{authorLabel}</span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {formatInquiryDate(message.createdAt)}
          </span>
        </div>
      </CardHeader>

      {/* 메시지 내용 */}
      <CardContent className="pt-0">
        <p className="text-sm break-words whitespace-pre-wrap xl:text-base">
          {message.content}
        </p>
      </CardContent>
    </Card>
  );
}

type ReplyFetcherData =
  | { success?: boolean; message?: InquiryDetailMessage }
  | { error?: string };

/** 답변 작성 폼 (카드형) */
function ReplyFormCard({
  isClosed,
  fetcher,
  content,
  onChangeContent,
}: {
  isClosed: boolean;
  fetcher: ReturnType<typeof useFetcher<ReplyFetcherData>>;
  content: string;
  onChangeContent: (next: string) => void;
}) {
  const isDisabled = isClosed || fetcher.state === "submitting";
  const hasError = Boolean(
    fetcher.data &&
      !("success" in fetcher.data && fetcher.data.success) &&
      "error" in fetcher.data &&
      fetcher.data.error,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">답변 작성</CardTitle>
        {isClosed && (
          <CardDescription>
            종료된 문의에는 추가 메시지를 보낼 수 없습니다.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <fetcher.Form method="post" className="flex flex-col gap-3">
          <input type="hidden" name="intent" value="sendMessage" />
          {hasError && fetcher.data && "error" in fetcher.data && (
            <p className="text-destructive text-sm">{fetcher.data.error}</p>
          )}
          <Textarea
            name="content"
            required
            value={content}
            onChange={(e) => onChangeContent(e.target.value)}
            disabled={isDisabled}
            placeholder={
              isClosed
                ? "닫힌 문의는 추가 메시지를 보낼 수 없습니다."
                : "추가로 전달하실 내용을 입력해 주세요."
            }
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isDisabled} className="gap-2">
              {fetcher.state === "submitting" ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SendIcon className="size-4" />
              )}
              답변 등록
            </Button>
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

/** 문의 상세 페이지 (티켓형 카드 레이아웃) */
export default function InquiryDetail({ loaderData }: Route.ComponentProps) {
  const { inquiry, messages, authUserId } = loaderData;
  const isClosed = inquiry.status === "closed";

  const [content, setContent] = useState("");
  const fetcher = useFetcher<ReplyFetcherData>();
  const revalidator = useRevalidator();
  const lastHandledResponseRef = useRef<ReplyFetcherData | null>(null);

  // 성공: 새 메시지 즉시 표시용 병합. revalidate 후에는 loaderData에 포함되므로 중복 없음.
  const displayMessages = useMemo(
    () =>
      mergeMessagesById(
        messages,
        fetcher.data &&
          "success" in fetcher.data &&
          fetcher.data.success &&
          fetcher.data.message
          ? [fetcher.data.message]
          : [],
      ),
    [messages, fetcher.data],
  );

  // 응답당 revalidate 1회만 수행 (스크립트 반복 리로드 방지). 성공 시 입력 비우기, 에러(종료 등) 시에도 revalidate로 폼 비활성화 반영.
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (lastHandledResponseRef.current === fetcher.data) return;
    lastHandledResponseRef.current = fetcher.data;
    if ("success" in fetcher.data && fetcher.data.success) {
      setContent("");
    }
    revalidator.revalidate();
  }, [fetcher.state, fetcher.data, revalidator]);

  return (
    <div className="mx-auto mt-20 w-full px-4 pb-20 xl:mt-25 xl:max-w-[800px]">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/inquiries">
            <MoveLeft className="size-4" /> 목록으로
          </Link>
        </Button>
      </div>

      {/* 상단: 제목, 카테고리, 상태, 작성자, 생성일 */}
      <Card className="mb-12">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="break-words">{inquiry.title}</CardTitle>
              <CardDescription className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>작성자: 내 문의</span>
                <span className="tabular-nums">
                  작성일: {formatInquiryDate(inquiry.created_at)}
                </span>
              </CardDescription>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <InquiryStatusBadge status={inquiry.status} />
              <Badge variant="secondary">
                {
                  INQUIRY_CATEGORY_LABELS[
                    inquiry.category as keyof typeof INQUIRY_CATEGORY_LABELS
                  ]
                }
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 중단: 메시지 히스토리 카드 리스트 (답변 등록 시 즉시 반영) */}
      <div className="mb-6 space-y-4">
        <h3 className="text-muted-foreground text-sm font-medium">문의 내용</h3>
        {displayMessages.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            아직 답변이 없습니다.
          </p>
        ) : (
          displayMessages.map((m) => (
            <MessageCard
              key={m.id}
              message={m}
              authorLabel={m.authorProfileId === authUserId ? "나" : "관리자"}
            />
          ))
        )}
      </div>

      {/* 하단: 답변 입력 카드 */}
      <ReplyFormCard
        isClosed={isClosed}
        fetcher={fetcher}
        content={content}
        onChangeContent={setContent}
      />
    </div>
  );
}

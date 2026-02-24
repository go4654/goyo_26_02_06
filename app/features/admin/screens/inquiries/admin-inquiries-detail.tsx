import type { Route } from "./+types/admin-inquiries-detail";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { Textarea } from "~/core/components/ui/textarea";
import { cn } from "~/core/lib/utils";
import { InquiryStatusBadge } from "~/features/inquiries/components/InquiryStatusBadge";
import { formatInquiryDate } from "~/features/inquiries/lib/format-inquiry-date";
import { mergeMessagesById } from "~/features/inquiries/lib/merge-messages";

import {
  type AdminInquiryDetailMessage,
  adminInquiriesDetailLoader,
} from "./server/admin-inquiries-detail.loader";
import { adminInquiriesAction } from "./server/admin-inquiries.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `문의 상세 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = adminInquiriesDetailLoader;
export const action = adminInquiriesAction;

type ActionData = {
  success?: true;
  error?: string;
  message?: AdminInquiryDetailMessage;
  updatedStatus?: "answered" | null;
};

/** 메시지 카드 1개 (티켓형, full width) */
function MessageCard({ message }: { message: AdminInquiryDetailMessage }) {
  const isAdmin = message.authorRole === "admin";
  return (
    <Card
      className={cn(
        isAdmin ? "border-primary bg-primary/20" : "bg-muted",
        "gap-0",
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isAdmin ? "default" : "outline"}>
            {isAdmin ? "관리자" : "회원"}
          </Badge>
          <span className="text-sm font-medium">
            {isAdmin ? "관리자" : "회원"}
          </span>
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

/** 답변 작성 폼 카드 */
function ReplyFormCard({
  isClosed,
  fetcher,
  content,
  onChangeContent,
}: {
  isClosed: boolean;
  fetcher: ReturnType<typeof useFetcher<ActionData>>;
  content: string;
  onChangeContent: (next: string) => void;
}) {
  const isDisabled = isClosed || fetcher.state === "submitting";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">답변 작성</CardTitle>
        {isClosed && (
          <CardDescription>
            종료된 문의에는 답변을 작성할 수 없습니다.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <fetcher.Form method="post" className="flex flex-col gap-3">
          <input type="hidden" name="intent" value="reply" />
          <Textarea
            name="content"
            required
            value={content}
            onChange={(e) => onChangeContent(e.target.value)}
            disabled={isDisabled}
            placeholder={
              isClosed
                ? "종료된 문의에는 답변을 작성할 수 없습니다."
                : "답변을 입력해 주세요."
            }
          />
          <div className="flex items-center justify-between gap-3">
            {fetcher.data?.error ? (
              <p className="text-destructive text-sm">{fetcher.data.error}</p>
            ) : (
              <span className="text-muted-foreground text-xs">
                {isClosed ? "상태가 '종료'인 경우 전송이 비활성화됩니다." : ""}
              </span>
            )}
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

/** 관리자 문의 상세 페이지 (티켓형 카드 레이아웃) */
export default function AdminInquiriesDetail({
  loaderData,
}: Route.ComponentProps) {
  const { inquiry, messages } = loaderData;
  const isClosed = inquiry.status === "closed";

  const [content, setContent] = useState("");
  const [nextStatus, setNextStatus] = useState(inquiry.status);

  const replyFetcher = useFetcher<ActionData>();
  const statusFetcher = useFetcher<ActionData>();
  const revalidator = useRevalidator();
  const lastReplyDataRef = useRef<ActionData | null>(null);
  const lastStatusDataRef = useRef<ActionData | null>(null);

  useEffect(() => {
    setNextStatus(inquiry.status);
  }, [inquiry.status]);

  // 답변 성공 시 같은 응답에 대해 revalidate 한 번만 수행 (재실행 시 스크립트 반복 리로드 방지)
  useEffect(() => {
    if (replyFetcher.state !== "idle" || !replyFetcher.data?.success) return;
    if (lastReplyDataRef.current === replyFetcher.data) return;
    lastReplyDataRef.current = replyFetcher.data;
    setContent("");
    revalidator.revalidate();
  }, [replyFetcher.state, replyFetcher.data, revalidator]);

  // 상태 변경 성공 시 같은 응답에 대해 revalidate 한 번만 수행 (재실행 시 스크립트 반복 리로드 방지)
  useEffect(() => {
    if (statusFetcher.state !== "idle" || !statusFetcher.data?.success) return;
    if (lastStatusDataRef.current === statusFetcher.data) return;
    lastStatusDataRef.current = statusFetcher.data;
    revalidator.revalidate();
  }, [statusFetcher.state, statusFetcher.data, revalidator]);

  const statusLabel = useMemo(
    () =>
      nextStatus === "pending"
        ? "대기"
        : nextStatus === "answered"
          ? "답변완료"
          : "종료",
    [nextStatus],
  );

  // 답변 성공 시 새 메시지 즉시 표시. revalidate 후에는 loaderData에 포함되므로 중복 없음.
  const displayMessages = useMemo(
    () =>
      mergeMessagesById(
        messages,
        replyFetcher.data?.success && replyFetcher.data?.message
          ? [replyFetcher.data.message]
          : [],
      ),
    [messages, replyFetcher.data?.success, replyFetcher.data?.message],
  );

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/users/inquiries">
            <MoveLeft className="size-4" /> 목록으로
          </Link>
        </Button>
      </div>

      {/* 상단: 제목, 카테고리, 상태, 작성자, 생성일/수정일, 상태 변경 */}
      <Card className="mb-4">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="break-words">{inquiry.title}</CardTitle>
              <CardDescription className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="break-all">{inquiry.author.email}</span>
                <span>•</span>
                <span>{inquiry.author.nickname}</span>

                <span>/</span>

                <span className="tabular-nums">
                  작성일: {formatInquiryDate(inquiry.createdAt)}
                </span>
                <span className="tabular-nums">
                  수정일: {formatInquiryDate(inquiry.updatedAt)}
                </span>
              </CardDescription>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <InquiryStatusBadge status={inquiry.status} />
              <Badge variant="secondary">{inquiry.category}</Badge>
            </div>
          </div>

          {/* 상태 변경 버튼 */}
          <statusFetcher.Form
            method="post"
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end"
          >
            <input type="hidden" name="intent" value="changeStatus" />
            <input type="hidden" name="status" value={nextStatus} />

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Select
                  value={nextStatus}
                  onValueChange={(v) => {
                    if (v === "pending" || v === "answered" || v === "closed") {
                      setNextStatus(v);
                    }
                  }}
                  disabled={statusFetcher.state === "submitting"}
                >
                  <SelectTrigger className="w-full max-w-[180px]">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="pending"
                      className="hover:text-text-2 cursor-pointer"
                    >
                      대기
                    </SelectItem>
                    <SelectItem
                      value="answered"
                      className="hover:text-text-1 cursor-pointer"
                    >
                      답변완료
                    </SelectItem>
                    <SelectItem
                      value="closed"
                      className="hover:text-text-1 cursor-pointer"
                    >
                      종료
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  variant="outline"
                  className="!border-primary cursor-pointer"
                  disabled={statusFetcher.state === "submitting"}
                >
                  상태 변경
                </Button>
              </div>

              <div>
                {statusFetcher.data?.error && (
                  <p className="text-destructive text-sm">
                    {statusFetcher.data.error}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  현재 선택: {statusLabel}
                </p>
              </div>
            </div>
          </statusFetcher.Form>
        </CardHeader>
      </Card>

      {/* 중단: 메시지 히스토리 카드 리스트 */}
      <div className="space-y-4">
        <h3 className="text-muted-foreground text-sm font-medium">
          메시지 히스토리
        </h3>
        {displayMessages.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm xl:text-base">
            아직 답변이 없습니다.
          </p>
        ) : (
          displayMessages.map((m) => <MessageCard key={m.id} message={m} />)
        )}
      </div>

      {/* 하단: 답변 입력 카드 */}
      <ReplyFormCard
        isClosed={isClosed}
        fetcher={replyFetcher}
        content={content}
        onChangeContent={setContent}
      />
    </div>
  );
}

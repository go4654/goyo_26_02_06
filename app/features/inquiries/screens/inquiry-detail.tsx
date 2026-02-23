import type { Route } from "./+types/inquiry-detail";

import { Link, useFetcher, useRevalidator } from "react-router";
import { Loader2Icon, SendIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "~/core/lib/utils";
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

import { InquiryStatusBadge } from "../components/InquiryStatusBadge";
import { formatInquiryDate } from "../lib/format-inquiry-date";
import { INQUIRY_CATEGORY_LABELS } from "../lib/mock-inquiries";
import type {
  InquiryDetailMessage,
} from "../server/inquiry-detail.loader";
import {
  inquiryDetailLoader,
} from "../server/inquiry-detail.loader";
import { inquiryDetailAction } from "../server/inquiry-detail.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `문의 상세 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = inquiryDetailLoader;
export const action = inquiryDetailAction;

function MessageBubble({
  message,
  isMine,
}: {
  message: InquiryDetailMessage;
  isMine: boolean;
}) {
  return (
    <div className="flex">
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap shadow-xs",
          isMine
            ? "ml-auto bg-primary text-primary-foreground"
            : "mr-auto bg-muted text-foreground",
        )}
      >
        <div className="break-words">{message.content}</div>
        <div
          className={cn(
            "mt-2 text-xs tabular-nums",
            isMine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {formatInquiryDate(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

function SendMessageForm({
  isClosed,
  fetcher,
  content,
  onChangeContent,
}: {
  isClosed: boolean;
  fetcher: ReturnType<typeof useFetcher<{ success?: boolean }>>;
  content: string;
  onChangeContent: (next: string) => void;
}) {
  const isSubmitting = fetcher.state !== "idle";
  const isDisabled = isClosed || isSubmitting;

  return (
    <fetcher.Form method="post" className="mt-6 flex flex-col gap-3">
      <input type="hidden" name="intent" value="sendMessage" />
      <Textarea
        name="content"
        required
        value={content}
        onChange={(e) => onChangeContent(e.target.value)}
        disabled={isDisabled}
        className="min-h-[120px]"
        placeholder={
          isClosed
            ? "닫힌 문의는 추가 메시지를 보낼 수 없습니다."
            : "추가로 전달하실 내용을 입력해 주세요."
        }
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isDisabled} className="gap-2">
          {isSubmitting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SendIcon className="size-4" />
          )}
          전송
        </Button>
      </div>
    </fetcher.Form>
  );
}

export default function InquiryDetail({ loaderData }: Route.ComponentProps) {
  const { inquiry, messages, authUserId } = loaderData;
  const isClosed = inquiry.status === "closed";
  const [content, setContent] = useState("");
  const fetcher = useFetcher<{ success?: boolean }>();
  const revalidator = useRevalidator();

  useEffect(() => {
    if (fetcher.data?.success) {
      setContent("");
      revalidator.revalidate();
    }
  }, [fetcher.data, revalidator]);

  return (
    <div className="mx-auto mt-20 w-full px-4 pb-40 xl:mt-25 xl:max-w-[1000px]">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/inquiries">목록으로</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="break-words">{inquiry.title}</CardTitle>
              <CardDescription className="mt-2">
                {formatInquiryDate(inquiry.created_at)} 작성
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
        <CardContent>
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="text-muted-foreground py-10 text-center text-sm">
                아직 작성된 메시지가 없습니다.
              </div>
            ) : (
              messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isMine={m.authorProfileId === authUserId}
                />
              ))
            )}
          </div>

          <SendMessageForm
            isClosed={isClosed}
            fetcher={fetcher}
            content={content}
            onChangeContent={setContent}
          />
        </CardContent>
      </Card>
    </div>
  );
}

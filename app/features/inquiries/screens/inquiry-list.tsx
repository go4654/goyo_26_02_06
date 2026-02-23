import type { Route } from "./+types/inquiry-list";

import { Link } from "react-router";

import type { InquiryListItem } from "../server/inquiries.loader";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";

import { InquiryStatusBadge } from "../components/InquiryStatusBadge";
import { formatInquiryDate } from "../lib/format-inquiry-date";
import { INQUIRY_CATEGORY_LABELS } from "../lib/mock-inquiries";
import { inquiriesLoader } from "../server/inquiries.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: `내 문의 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = inquiriesLoader;

/** 상단: 제목 + 문의하기 버튼 */
function InquiryListHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold">내 문의</h1>
      <Button
        variant="outline"
        asChild
        size="sm"
        className="border-secondary w-fit shrink-0 border-1"
      >
        <Link to="/inquiries/new">문의하기</Link>
      </Button>
    </div>
  );
}

/** 빈 상태: 문의 없을 때 메시지 + 문의하기 버튼 */
function InquiryListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <p className="text-muted-foreground">작성된 문의가 없습니다.</p>
      <Button asChild size="sm">
        <Link to="/inquiries/new">문의하기</Link>
      </Button>
    </div>
  );
}

/** 테이블 본문 행 한 줄 */
function InquiryTableRow({ item }: { item: InquiryListItem }) {
  return (
    <TableRow className="h-15">
      <TableCell className="font-medium">
        <Link
          to={`/inquiries/${item.id}`}
          className="text-base hover:underline"
        >
          {item.title}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {
            INQUIRY_CATEGORY_LABELS[
              item.category as keyof typeof INQUIRY_CATEGORY_LABELS
            ]
          }
        </Badge>
      </TableCell>
      <TableCell>
        <InquiryStatusBadge
          status={item.status as "pending" | "answered" | "closed"}
        />
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {formatInquiryDate(item.lastActivityAt)}
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {formatInquiryDate(item.createdAt)}
      </TableCell>
    </TableRow>
  );
}

/** 목록 테이블 */
function InquiryTable({ items }: { items: InquiryListItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>제목</TableHead>
          <TableHead className="whitespace-nowrap">카테고리</TableHead>
          <TableHead className="whitespace-nowrap">상태</TableHead>
          <TableHead className="whitespace-nowrap">최근답변</TableHead>
          <TableHead className="whitespace-nowrap">작성일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <InquiryTableRow key={item.id} item={item} />
        ))}
      </TableBody>
    </Table>
  );
}

export default function InquiryList({ loaderData }: Route.ComponentProps) {
  const inquiries = loaderData?.inquiries ?? [];
  const hasItems = inquiries.length > 0;

  return (
    <div className="mx-auto mt-20 w-full px-4 pb-40 xl:mt-25 xl:max-w-[900px]">
      <InquiryListHeader />
      <div className="mt-8">
        {hasItems ? <InquiryTable items={inquiries} /> : <InquiryListEmpty />}
      </div>
    </div>
  );
}

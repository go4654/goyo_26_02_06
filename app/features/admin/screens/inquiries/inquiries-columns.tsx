import type { ColumnDef } from "@tanstack/react-table";

import type { AdminInquiryRow } from "./queries";

import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";

import { formatDate } from "../galleries/lib/formatters";

/** 문의 상태 Badge 스타일 (pending: yellow, answered: green, closed: secondary) */
function StatusBadge({ status }: { status: AdminInquiryRow["status"] }) {
  const style =
    status === "pending"
      ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/30 dark:text-yellow-400 dark:border-yellow-500/40"
      : status === "answered"
        ? "bg-green-500/20 text-green-600 border-green-500/30 dark:text-green-400 dark:border-green-500/40"
        : "bg-muted text-muted-foreground";
  const label =
    status === "pending" ? "대기" : status === "answered" ? "답변완료" : "종료";

  return (
    <Badge variant="outline" className={style}>
      {label}
    </Badge>
  );
}

/**
 * 관리자 문의 테이블 컬럼 정의
 * 제목, 이메일, 닉네임, 상태, 등록일, 최근 수정일, 보기 버튼
 */
export const inquiriesColumns: ColumnDef<AdminInquiryRow>[] = [
  {
    accessorKey: "title",
    header: "제목",
    cell: ({ row }) => (
      <div className="text-text-1 line-clamp-1 font-medium">
        {row.original.title}
      </div>
    ),
    size: 220,
    minSize: 150,
    maxSize: 400,
  },
  {
    accessorKey: "email",
    header: "작성자 이메일",
    cell: ({ row }) => (
      <div className="text-text-2 max-w-[200px] truncate">
        {row.original.email}
      </div>
    ),
    size: 200,
    minSize: 120,
    maxSize: 280,
  },
  {
    accessorKey: "nickname",
    header: "작성자 닉네임",
    cell: ({ row }) => (
      <div className="text-text-2">{row.original.nickname}</div>
    ),
    size: 120,
    minSize: 90,
    maxSize: 180,
  },
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    size: 100,
    minSize: 80,
    maxSize: 120,
  },
  {
    accessorKey: "created_at",
    header: "등록일",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatDate(row.original.created_at)}
      </div>
    ),
    size: 120,
    minSize: 80,
    maxSize: 100,
  },
  {
    accessorKey: "updated_at",
    header: "최근 수정일",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatDate(row.original.updated_at)}
      </div>
    ),
    size: 120,
    minSize: 80,
    maxSize: 100,
  },
  // {
  //   id: "actions",
  //   header: "",
  //   cell: ({ row }) => (
  //     <Button variant="outline" size="sm" asChild>
  //       <Link to={`/admin/users/inquiries/${row.original.id}`}>보기</Link>
  //     </Button>
  //   ),
  //   enableSorting: false,
  //   enableResizing: false,
  //   size: 80,
  //   minSize: 80,
  //   maxSize: 80,
  // },
];

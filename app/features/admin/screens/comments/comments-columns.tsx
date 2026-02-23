import type { ColumnDef } from "@tanstack/react-table";

import type { AdminCommentRow } from "./server/comments.loader";

import { EllipsisVertical, Eye, EyeOff } from "lucide-react";
import { DateTime } from "luxon";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Checkbox } from "~/core/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";

/**
 * 날짜 포맷팅 (Luxon 사용, 한국 시간대)
 */
function formatDate(dateString: string): string {
  const dt = DateTime.fromISO(dateString, { zone: "Asia/Seoul" });
  if (!dt.isValid) return "-";
  return dt.toFormat("yyyy.MM.dd HH:mm");
}


/**
 * 체크박스 컬럼
 */
const selectColumn: ColumnDef<AdminCommentRow> = {
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="모든 행 선택"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="행 선택"
    />
  ),
  enableResizing: false,
  enableSorting: false,
  size: 50,
  minSize: 50,
  maxSize: 50,
};

/**
 * 액션 컬럼
 */
const actionColumn: ColumnDef<AdminCommentRow> = {
  id: "actions",
  header: "",
  cell: () => {
    return (
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-text-2">
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="p-2">
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              상세보기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
  enableResizing: false,
  enableSorting: false,
  size: 60,
  minSize: 60,
  maxSize: 60,
};

/**
 * 댓글 관리 테이블 컬럼 정의
 */
export const commentsColumns: ColumnDef<AdminCommentRow>[] = [
  selectColumn,
  {
    accessorKey: "content",
    header: "댓글 내용",
    cell: ({ row }) => {
      const { content, isDeleted, parentId } = row.original;
      return (
        <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden">
          {parentId && (
            <Badge
              variant="outline"
              className="shrink-0 border-primary text-primary text-xs"
            >
              대댓글
            </Badge>
          )}
          <span
            className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text-1"
            title={isDeleted ? undefined : content}
          >
            {isDeleted ? (
              <span className="italic text-text-3">삭제된 댓글입니다</span>
            ) : (
              content
            )}
          </span>
        </div>
      );
    },
    size: 300,
    minSize: 200,
    maxSize: 500,
  },
  {
    accessorKey: "className",
    header: "클래스",
    cell: ({ row }) => {
      const className = row.original.className;
      return <div className="text-text-2 text-sm">{className}</div>;
    },
    size: 200,
    minSize: 150,
    maxSize: 300,
  },
  {
    accessorKey: "userName",
    header: "작성자",
    cell: ({ row }) => {
      const userName = row.original.userName;
      return <div className="text-text-2 text-sm">{userName}</div>;
    },
    size: 150,
    minSize: 100,
    maxSize: 200,
  },
  {
    accessorKey: "isVisible",
    header: "공개/숨김",
    cell: ({ row }) => {
      const isVisible = row.original.isVisible;
      return (
        <div className="flex items-center gap-2">
          {isVisible ? (
            <Eye className="h-4 w-4 text-green-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-red-600" />
          )}
          <span className="text-text-2 text-sm">
            {isVisible ? "공개" : "숨김"}
          </span>
        </div>
      );
    },
    size: 100,
    minSize: 80,
    maxSize: 120,
  },
  {
    accessorKey: "likesCount",
    header: "좋아요",
    cell: ({ row }) => {
      const count = row.original.likesCount;
      return <div className="text-text-2 text-sm">{count}</div>;
    },
    size: 80,
    minSize: 60,
    maxSize: 100,
  },
  {
    accessorKey: "createdAt",
    header: "작성일",
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return <div className="text-text-3 text-sm">{formatDate(date)}</div>;
    },
    size: 150,
    minSize: 120,
    maxSize: 180,
  },
  // actionColumn,
];

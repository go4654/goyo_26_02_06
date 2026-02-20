import type { ColumnDef } from "@tanstack/react-table";

import type { AdminNewsRow } from "./server/news.loader";

import { Badge } from "~/core/components/ui/badge";
import { Checkbox } from "~/core/components/ui/checkbox";

import { formatDate, formatNumber } from "./lib/formatters";

/**
 * 체크박스 컬럼 - 행 선택을 위한 컬럼
 */
const selectColumn: ColumnDef<AdminNewsRow> = {
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
 * 뉴스 관리 테이블 컬럼 정의
 * 제목, 카테고리, 조회수, 공개여부, 작성일, 최근 수정일 (좋아요/저장 없음)
 */
export const newsColumns: ColumnDef<AdminNewsRow>[] = [
  selectColumn,
  {
    accessorKey: "title",
    header: "제목",
    cell: ({ row }) => (
      <div className="text-text-1 line-clamp-1 font-medium">
        {row.original.title}
      </div>
    ),
    size: 300,
    minSize: 150,
    maxSize: 500,
  },
  {
    accessorKey: "category",
    header: "카테고리",
    cell: ({ row }) => (
      <div className="text-text-2">{row.original.category}</div>
    ),
    size: 120,
    minSize: 100,
    maxSize: 200,
  },
  {
    accessorKey: "view_count",
    header: "조회수",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatNumber(row.original.view_count)}
      </div>
    ),
    size: 100,
    minSize: 80,
    maxSize: 150,
  },
  {
    accessorKey: "is_published",
    header: "공개여부",
    cell: ({ row }) => {
      const isPublished = row.original.is_published;
      return (
        <Badge
          variant={isPublished ? "default" : "secondary"}
          className="rounded-full"
        >
          {isPublished ? "공개" : "비공개"}
        </Badge>
      );
    },
    size: 100,
    minSize: 90,
    maxSize: 120,
  },
  {
    accessorKey: "created_at",
    header: "작성일",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatDate(row.original.created_at)}
      </div>
    ),
    size: 120,
    minSize: 100,
    maxSize: 150,
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
    minSize: 100,
    maxSize: 150,
  },
];

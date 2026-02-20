import type { ColumnDef } from "@tanstack/react-table";

import type { AdminGalleryRow } from "./server/galleries.loader";

import { EllipsisVertical } from "lucide-react";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Checkbox } from "~/core/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";

import { formatDate, formatNumber } from "./lib/formatters";

/**
 * 체크박스 컬럼 - 행 선택을 위한 컬럼
 */
const selectColumn: ColumnDef<AdminGalleryRow> = {
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
 * 액션 컬럼 - 수정/삭제 드롭다운 메뉴
 */
const actionColumn: ColumnDef<AdminGalleryRow> = {
  id: "actions",
  header: "",
  cell: ({ row }) => {
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
              수정
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              삭제
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
 * 갤러리 관리 테이블 컬럼 정의
 * DB 필드(like_count, save_count, view_count, is_published, created_at, updated_at)에 바인딩
 */
export const galleriesColumns: ColumnDef<AdminGalleryRow>[] = [
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
    accessorKey: "like_count",
    header: "좋아요 수",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatNumber(row.original.like_count)}
      </div>
    ),
    size: 100,
    minSize: 80,
    maxSize: 150,
  },
  {
    accessorKey: "save_count",
    header: "저장 수",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatNumber(row.original.save_count)}
      </div>
    ),
    size: 100,
    minSize: 80,
    maxSize: 150,
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
    header: "노출여부",
    cell: ({ row }) => {
      const isPublished = row.original.is_published;
      return (
        <Badge
          variant={isPublished ? "default" : "secondary"}
          className="rounded-full"
        >
          {isPublished ? "노출" : "비노출"}
        </Badge>
      );
    },
    size: 100,
    minSize: 90,
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
  // actionColumn,
];

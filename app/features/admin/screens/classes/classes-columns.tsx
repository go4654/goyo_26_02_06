import type { ColumnDef } from "@tanstack/react-table";

import type { AdminClassRow } from "./server/classes.loader";

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
const selectColumn: ColumnDef<AdminClassRow> = {
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
  enableResizing: false, // 체크박스 컬럼은 리사이징 비활성화
  enableSorting: false, // 체크박스 컬럼은 정렬 비활성화
  size: 50,
  minSize: 50,
  maxSize: 50,
};

/**
 * 액션 컬럼 - 수정/삭제 드롭다운 메뉴
 */
const actionColumn: ColumnDef<AdminClassRow> = {
  id: "actions",
  header: "",
  cell: ({ row }) => {
    const item = row.original;

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
              onSelect={(e) => {
                e.preventDefault();
                console.log("edit", item.id);
              }}
            >
              수정
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                console.log("delete", item.id);
              }}
            >
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
  enableResizing: false, // 액션 컬럼은 리사이징 비활성화
  enableSorting: false, // 액션 컬럼은 정렬 비활성화
  size: 60,
  minSize: 60,
  maxSize: 60,
};

/**
 * 클래스 관리 테이블의 컬럼 정의
 * 컬럼 리사이징을 위해 size, minSize, maxSize 속성을 설정합니다.
 */
export const classesColumns: ColumnDef<AdminClassRow>[] = [
  selectColumn,
  {
    accessorKey: "title",
    header: "제목",
    cell: ({ row }) => {
      const title = row.original.title;
      return (
        <div className="text-text-1 line-clamp-1 font-medium">{title}</div>
      );
    },
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
    accessorKey: "likes",
    header: "좋아요 수",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatNumber(row.original.likes)}
      </div>
    ),
    size: 100,
    minSize: 80,
    maxSize: 150,
  },
  {
    accessorKey: "saves",
    header: "저장 수",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatNumber(row.original.saves)}
      </div>
    ),
    size: 100,
    minSize: 80,
    maxSize: 150,
  },
  {
    accessorKey: "views",
    header: "조회수",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatNumber(row.original.views)}
      </div>
    ),
    size: 100,
    minSize: 80,
    maxSize: 150,
  },
  {
    accessorKey: "isVisible",
    header: "노출여부",
    cell: ({ row }) => {
      const isVisible = row.original.isVisible;
      return (
        <Badge
          variant={isVisible ? "default" : "secondary"}
          className="rounded-full"
        >
          {isVisible ? "노출" : "비노출"}
        </Badge>
      );
    },
    size: 100,
    minSize: 90,
    maxSize: 120,
  },
  {
    accessorKey: "createdAt",
    header: "등록일",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatDate(row.original.createdAt)}
      </div>
    ),
    size: 120,
    minSize: 100,
    maxSize: 150,
  },
  {
    accessorKey: "updatedAt",
    header: "최근 수정일",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatDate(row.original.updatedAt)}
      </div>
    ),
    size: 120,
    minSize: 100,
    maxSize: 150,
  },
  actionColumn,
];

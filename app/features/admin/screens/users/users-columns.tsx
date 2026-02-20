import type { ColumnDef } from "@tanstack/react-table";

import type { AdminUserRow } from "./server/users.loader";

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

import { formatDate } from "./lib/formatters";

/**
 * 체크박스 컬럼 - 행 선택을 위한 컬럼
 */
const selectColumn: ColumnDef<AdminUserRow> = {
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
const actionColumn: ColumnDef<AdminUserRow> = {
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
              onSelect={(e) => e.preventDefault()}
            >
              수정
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
 * 유저 관리 테이블의 컬럼 정의
 * 컬럼 리사이징을 위해 size, minSize, maxSize 속성을 설정합니다.
 */
export const usersColumns: ColumnDef<AdminUserRow>[] = [
  selectColumn,
  {
    accessorKey: "email",
    header: "이메일",
    cell: ({ row }) => {
      const email = row.original.email;
      return <div className="text-text-1 font-medium">{email}</div>;
    },
    size: 250,
    minSize: 200,
    maxSize: 350,
  },
  {
    accessorKey: "nickname",
    header: "닉네임",
    cell: ({ row }) => (
      <div className="text-text-2">{row.original.nickname}</div>
    ),
    size: 150,
    minSize: 120,
    maxSize: 200,
  },
  {
    accessorKey: "createdAt",
    header: "가입일",
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
    accessorKey: "lastActiveAt",
    header: "최근 활동일",
    cell: ({ row }) => (
      <div className="text-text-2 tabular-nums">
        {formatDate(row.original.lastActiveAt)}
      </div>
    ),
    size: 120,
    minSize: 100,
    maxSize: 150,
  },
  {
    accessorKey: "galleryAccess",
    header: "포폴 접근 권한",
    cell: ({ row }) => {
      const hasAccess = row.original.galleryAccess;
      return (
        <Badge
          variant={hasAccess ? "default" : "secondary"}
          className="rounded-full"
        >
          {hasAccess ? "허용" : "비허용"}
        </Badge>
      );
    },
    size: 130,
    minSize: 120,
    maxSize: 150,
  },
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant={status === "active" ? "default" : "destructive"}
          className="rounded-full"
        >
          {status === "active" ? "활성" : "정지"}
        </Badge>
      );
    },
    size: 100,
    minSize: 90,
    maxSize: 120,
  },
  actionColumn,
];

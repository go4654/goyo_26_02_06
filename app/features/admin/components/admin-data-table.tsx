import type {
  ColumnDef,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";

/**
 * AdminDataTable Props
 * 갤러리, 뉴스, 댓글 등 관리자 페이지에서 재사용 가능한 테이블 컴포넌트
 */
interface AdminDataTableProps<TData> {
  /** 테이블에 표시할 데이터 배열 */
  data: TData[];
  /** tanstack table 컬럼 정의 */
  columns: ColumnDef<TData, any>[];
  /** 검색 필터 placeholder 텍스트 */
  searchPlaceholder?: string;
  /** 행 선택 콜백 (선택된 행들을 반환) */
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  /** 빈 데이터 시 표시할 메시지 */
  emptyMessage?: string;
  /** 선택된 행 삭제 콜백 */
  onDeleteSelected?: (selectedRows: TData[]) => void | Promise<void>;
  /** 행 클릭 콜백 (행 데이터를 반환) */
  onRowClick?: (row: TData) => void;
}

/**
 * AdminDataTable - 관리자 페이지용 재사용 가능한 데이터 테이블
 *
 * 주요 기능:
 * - 컬럼 리사이징: 컬럼 헤더 우측을 드래그하여 너비 조절
 * - 정렬: 컬럼 헤더 클릭으로 오름차순/내림차순 정렬
 * - 검색: 전역 필터로 모든 컬럼 데이터 검색
 * - 페이지네이션: 이전/다음 페이지 이동
 * - 행 선택: 체크박스로 단일/전체 행 선택
 *
 * @example
 * ```tsx
 * <AdminDataTable
 *   data={classes}
 *   columns={classesColumns}
 *   searchPlaceholder="클래스 검색..."
 *   onRowSelectionChange={(selected) => console.log(selected)}
 * />
 * ```
 */
export default function AdminDataTable<TData>({
  data,
  columns,
  searchPlaceholder = "검색...",
  onRowSelectionChange,
  emptyMessage = "결과가 없습니다.",
  onDeleteSelected,
  onRowClick,
}: AdminDataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // 행 선택 변경 시 콜백 호출
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = Object.keys(rowSelection)
        .filter((key) => rowSelection[key])
        .map((key) => data[Number.parseInt(key)])
        .filter(Boolean);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, data, onRowSelectionChange]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnSizing,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    columnResizeMode: "onChange", // 드래그 중 실시간 리사이징
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    enableColumnResizing: true,
    enableRowSelection: true, // 행 선택 활성화
    defaultColumn: {
      minSize: 50,
      size: 150,
      maxSize: 500,
    },
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      {/* Toolbar: 검색 + 결과 카운트 */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Input
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 max-w-[320px]"
        />

        <div className="text-text-3 text-sm">
          총{" "}
          <span className="text-text-1 font-semibold">
            {table.getFilteredRowModel().rows.length}
          </span>
          개
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <Table
          style={{
            width: table.getCenterTotalSize(),
            minWidth: "100%", // 테이블이 컨테이너 전체 너비를 채우도록 설정
            tableLayout: "fixed", // 고정 레이아웃으로 컬럼 리사이징 정확도 향상
          }}
        >
          <TableHeader className="bg-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const canResize = header.column.getCanResize();
                  const isResizing = header.column.getIsResizing();
                  const isLastColumn = index === headerGroup.headers.length - 1;

                  return (
                    <TableHead
                      key={header.id}
                      className="text-text-2 group relative"
                      style={{
                        width: `${header.getSize()}px`,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex h-full items-center justify-between">
                          {/* 정렬 버튼 */}
                          <button
                            type="button"
                            className="inline-flex flex-1 items-center gap-2"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getIsSorted() === "asc" ? " ↑" : ""}
                            {header.column.getIsSorted() === "desc" ? " ↓" : ""}
                          </button>

                          {/* 리사이즈 핸들 - 항상 보이는 경계선 + 호버 시 강조 */}
                          {canResize && !isLastColumn && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={`absolute top-0 right-0 h-full w-[2px] cursor-col-resize transition-all select-none ${
                                isResizing
                                  ? "bg-primary z-10 w-[3px]"
                                  : "group-hover:bg-primary/50 bg-white/10"
                              }`}
                              style={{
                                userSelect: "none",
                                touchAction: "none",
                              }}
                              aria-label="컬럼 너비 조절"
                            />
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`border-white/10 ${
                    onRowClick ? "cursor-pointer hover:bg-white/5" : ""
                  }`}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={(e) => {
                    // 체크박스나 버튼 클릭 시에는 행 클릭 이벤트 발생하지 않도록
                    const target = e.target as HTMLElement;
                    if (
                      target.closest("button") ||
                      target.closest("input[type='checkbox']") ||
                      target.closest("[role='menuitem']")
                    ) {
                      return;
                    }
                    if (onRowClick) {
                      onRowClick(row.original);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="align-middle"
                      style={{
                        width: `${cell.column.getSize()}px`,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-text-2 py-10 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center justify-start gap-3">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <>
              <span className="text-text-3 text-sm">
                {table.getFilteredSelectedRowModel().rows.length}개 선택됨
              </span>
              {onDeleteSelected && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    const selectedRows = table
                      .getFilteredSelectedRowModel()
                      .rows.map((row) => row.original);
                    await onDeleteSelected(selectedRows);
                    // 삭제 후 선택 해제
                    setRowSelection({});
                  }}
                >
                  선택 삭제
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            이전
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}

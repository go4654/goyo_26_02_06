import type { Route } from "./+types/admin-comments";
import type { AdminCommentRow } from "./server/comments.loader";

import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/core/components/ui/alert-dialog";
import { Button } from "~/core/components/ui/button";

import AdminDataTable from "../../components/admin-data-table";
import { commentsColumns } from "./comments-columns";
import { getContentPathForComment } from "./lib/get-content-path";
import { commentsAction } from "./server/comments.action";
import { commentsLoader } from "./server/comments.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: `댓글 관리 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = commentsLoader;
export const action = commentsAction;

type ActionResponse =
  | {
      success: true;
      operation: "toggle_visibility" | "delete";
      count: number;
      failed?: Array<{ commentId: string; error: string }>;
    }
  | { error: string };

/**
 * 댓글 관리 페이지
 *
 * 기능:
 * - 모든 댓글 조회 (is_visible=false 포함)
 * - 가시성 토글 (is_visible)
 * - 하드 삭제 (서버 액션, 삭제 후 revalidate로 목록 갱신)
 */
export default function AdminComments({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const fetcher = useFetcher<ActionResponse>();
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<AdminCommentRow[]>([]);
  /** 동일 응답으로 토스트/재요청이 반복되지 않도록 마지막 처리한 응답 보관 */
  const lastProcessedResponseRef = useRef<ActionResponse | null>(null);

  /** 행 클릭 시 해당 콘텐츠(클래스/뉴스/갤러리) 상세 페이지로 이동 */
  const handleRowClick = (row: AdminCommentRow) => {
    const path = getContentPathForComment(row.entityType, row.entitySlug);
    if (path !== "#") navigate(path);
  };

  // 가시성 토글 다이얼로그 열기
  const handleOpenVisibilityDialog = (rows: AdminCommentRow[]) => {
    if (rows.length === 0) return;
    setSelectedRows(rows);
    setVisibilityDialogOpen(true);
  };

  // 삭제 다이얼로그 열기
  const handleOpenDeleteDialog = (rows: AdminCommentRow[]) => {
    if (rows.length === 0) return;
    setSelectedRows(rows);
    setDeleteDialogOpen(true);
  };

  // 다이얼로그 닫기
  const handleCloseDialogs = () => {
    setVisibilityDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedRows([]);
  };

  // 가시성 토글 확정
  const handleConfirmToggleVisibility = () => {
    const commentIds = selectedRows.map((row) => row.id);
    fetcher.submit(
      { operation: "toggle_visibility", commentIds },
      { method: "POST", encType: "application/json" },
    );
  };

  // 삭제 확정 (서버 액션으로 하드 삭제)
  const handleConfirmDelete = () => {
    const commentIds = selectedRows.map((row) => row.id);
    fetcher.submit(
      { operation: "delete", commentIds },
      { method: "POST", encType: "application/json" },
    );
  };

  // 액션 완료 후 처리: 응답당 1회만 실행 (토스트 1회, revalidate 1회, 재요청/상태 반복 방지)
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (lastProcessedResponseRef.current === fetcher.data) return;
    lastProcessedResponseRef.current = fetcher.data;

    const data = fetcher.data;

    if ("success" in data && data.success) {
      setVisibilityDialogOpen(false);
      setDeleteDialogOpen(false);
      setSelectedRows([]);

      const operationText =
        data.operation === "toggle_visibility" ? "가시성 변경" : "삭제";

      if (data.failed && data.failed.length > 0) {
        toast.warning(`${data.count}개 ${operationText} 완료`, {
          description:
            data.failed.map((f) => f.error).join("\n") ||
            `실패: ${data.failed.length}건`,
          duration: 5000,
        });
      } else {
        toast.success(`${data.count}개의 댓글이 ${operationText}되었습니다.`, {
          duration: 3000,
        });
      }

      revalidator.revalidate();
      return;
    }

    if ("error" in data) {
      setVisibilityDialogOpen(false);
      setDeleteDialogOpen(false);
      setSelectedRows([]);
      toast.error("작업 실패", {
        description: data.error,
        duration: 5000,
      });
    }
  }, [fetcher.state, fetcher.data]);

  const isLoading = fetcher.state !== "idle";

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-1 text-3xl font-bold">댓글 관리</h1>
          <p className="text-text-3 mt-1">
            모든 댓글을 확인하고 관리할 수 있습니다
          </p>
        </div>
      </div>

      <AdminDataTable
        columns={commentsColumns}
        data={loaderData.rows}
        searchPlaceholder="댓글 내용, 작성자 검색..."
        onRowSelectionChange={() => {}}
        onRowClick={handleRowClick}
        customActions={[
          {
            label: "공개/숨김 변경",
            onClick: handleOpenVisibilityDialog,
          },
          {
            label: "삭제",
            variant: "destructive",
            onClick: handleOpenDeleteDialog,
          },
        ]}
      />

      {/* 가시성 토글 확인 다이얼로그 */}
      <AlertDialog
        open={visibilityDialogOpen}
        onOpenChange={setVisibilityDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>가시성 변경 확인</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedRows.length}개 댓글의 가시성을 변경하시겠습니까?
              <br />
              현재 공개 상태인 댓글은 숨김으로, 숨김 상태인 댓글은 공개로
              전환됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialogs}>
              <Button variant="outline" className="cursor-pointer">
                취소
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={handleConfirmToggleVisibility}
                disabled={isLoading}
                className="cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "변경"
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>댓글 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedRows.length}개 댓글을 삭제하시겠습니까?
              <br />
              삭제된 댓글은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialogs}>
              <Button variant="outline" className="cursor-pointer">
                취소
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction
              asChild
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Button className="cursor-pointer">삭제</Button>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

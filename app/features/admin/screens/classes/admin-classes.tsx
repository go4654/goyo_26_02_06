import type { Route } from "./+types/admin-classes";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useFetcher, useNavigate } from "react-router";
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
import { classesColumns } from "./classes-columns";
import { classesDeleteAction } from "./server/classes-delete.action";
import { classesLoader } from "./server/classes.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: `클래스 관리 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = classesLoader;
export const action = classesDeleteAction;

type DeleteActionResponse =
  | {
      success: true;
      deletedCount: number;
      failed: Array<{ classId: string; error: string }>;
    }
  | { error: string };

export default function Classes({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher<DeleteActionResponse>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<typeof loaderData.rows>([]);

  /**
   * 삭제 다이얼로그 열기
   */
  const handleOpenDeleteDialog = (rows: typeof loaderData.rows) => {
    if (rows.length === 0) {
      return;
    }
    setSelectedRows(rows);
    setIsDeleteDialogOpen(true);
  };

  /**
   * 삭제 다이얼로그 닫기
   */
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedRows([]);
  };

  /**
   * 실제 삭제 실행
   */
  const handleConfirmDelete = () => {
    const classIds = selectedRows.map((row) => row.id);

    fetcher.submit(
      { classIds },
      {
        method: "DELETE",
        encType: "application/json",
      },
    );
  };

  useEffect(() => {
    // 삭제 완료 후 처리
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      const { deletedCount, failed } = fetcher.data;

      // 다이얼로그 닫기 및 선택 상태 초기화
      handleCloseDeleteDialog();

      if (failed && failed.length > 0) {
        const errorMessages = failed
          .map(
            (f: { classId: string; error: string }) =>
              `클래스 ID ${f.classId}: ${f.error}`,
          )
          .join("\n");
        toast.warning(`${deletedCount}개 삭제 완료`, {
          description: `실패한 항목:\n${errorMessages}`,
          duration: 5000,
        });
      } else {
        toast.success(`${deletedCount}개의 클래스가 삭제되었습니다.`, {
          duration: 3000,
        });
      }

      // 페이지 새로고침하여 목록 갱신
    }

    // 삭제 실패 처리
    if (fetcher.data && "error" in fetcher.data) {
      handleCloseDeleteDialog();
      toast.error("삭제 실패", {
        description: fetcher.data.error,
        duration: 5000,
      });
    }
  }, [fetcher.data]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-h5">클래스 관리</h1>

        <Button asChild>
          <Link to="/admin/classes/new">
            <span>클래스 추가</span>
            <Plus className="size-4" strokeWidth={1} />
          </Link>
        </Button>
      </div>

      <AdminDataTable
        data={loaderData.rows}
        columns={classesColumns}
        searchPlaceholder="클래스 제목, 카테고리 검색..."
        emptyMessage="등록된 클래스가 없습니다."
        onDeleteSelected={handleOpenDeleteDialog}
        onRowClick={(row) => {
          navigate(`/admin/classes/${row.slug}`);
        }}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>클래스를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              선택된 클래스 {selectedRows.length}개가 영구 삭제됩니다.
              <br />이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={handleCloseDeleteDialog}>
                취소
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={fetcher.state === "submitting"}
              >
                {fetcher.state === "submitting" ? "삭제 중..." : "삭제"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

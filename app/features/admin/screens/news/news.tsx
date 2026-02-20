import type { Route } from "./+types/news";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useRevalidator, useFetcher } from "react-router";
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
import { newsColumns } from "./news-columns";
import { newsDeleteAction } from "./server/news-delete.action";
import { newsLoader } from "./server/news.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: `뉴스 관리 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = newsLoader;
export const action = newsDeleteAction;

type DeleteActionResponse =
  | {
      success: true;
      deletedCount: number;
      failed: Array<{ newsId: string; error: string }>;
    }
  | { error: string };

/**
 * 뉴스 관리 페이지
 *
 * - 뉴스 목록 테이블 표시 (제목, 카테고리, 조회수, 공개여부, 작성일, 최근 수정일)
 * - 행 클릭 시 /admin/news/:slug 수정 페이지로 이동
 * - 체크박스 다중 선택 후 삭제(AlertDialog) → Hard Delete
 */
export default function News({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const fetcher = useFetcher<DeleteActionResponse>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<typeof loaderData.rows>([]);

  const handleOpenDeleteDialog = (rows: typeof loaderData.rows) => {
    if (rows.length === 0) return;
    setSelectedRows(rows);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedRows([]);
  };

  const handleConfirmDelete = () => {
    const newsIds = selectedRows.map((row) => row.id);
    fetcher.submit(
      { newsIds },
      {
        method: "DELETE",
        encType: "application/json",
      },
    );
  };

  useEffect(() => {
    if (!fetcher.data) return;

    if ("success" in fetcher.data && fetcher.data.success) {
      const { deletedCount, failed } = fetcher.data;
      handleCloseDeleteDialog();
      revalidator.revalidate();

      if (failed && failed.length > 0) {
        const errorMessages = failed
          .map((f) => `뉴스 ID ${f.newsId}: ${f.error}`)
          .join("\n");
        toast.warning(`${deletedCount}개 삭제 완료`, {
          description: `실패한 항목:\n${errorMessages}`,
          duration: 5000,
        });
      } else {
        toast.success(`${deletedCount}개의 뉴스가 삭제되었습니다.`, {
          duration: 3000,
        });
      }
    }

    if ("error" in fetcher.data) {
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
        <h1 className="text-h5">뉴스 관리</h1>

        <Button asChild>
          <Link to="/admin/news/new">
            <span>뉴스 추가</span>
            <Plus className="size-4" strokeWidth={1} />
          </Link>
        </Button>
      </div>

      <AdminDataTable
        data={loaderData.rows}
        columns={newsColumns}
        searchPlaceholder="뉴스 제목, 카테고리 검색..."
        emptyMessage="등록된 뉴스가 없습니다."
        onDeleteSelected={handleOpenDeleteDialog}
        onRowClick={(row) => navigate(`/admin/news/${row.slug}`)}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>뉴스를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              선택된 뉴스 {selectedRows.length}개가 삭제됩니다. 이 작업은
              되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={handleCloseDeleteDialog}>
                취소
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                삭제
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

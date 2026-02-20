import type { Route } from "./+types/galleries";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

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
import { galleriesColumns } from "./galleries-columns";
import { galleriesAction } from "./server/galleries.action";
import { galleriesLoader } from "./server/galleries.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: `갤러리 관리 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = galleriesLoader;
export const action = galleriesAction;

/**
 * 갤러리 관리 페이지
 *
 * - galleries 테이블 실제 데이터 바인딩
 * - 행 클릭 시 /admin/gallery/:slug 수정 페이지로 이동
 */
export default function Galleries({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
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
    // TODO: 갤러리 일괄 삭제 액션 연동 시 구현
    handleCloseDeleteDialog();
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-h5">갤러리 관리</h1>

        <Button asChild>
          <Link to="/admin/gallery/new">
            <span>갤러리 추가</span>
            <Plus className="size-4" strokeWidth={1} />
          </Link>
        </Button>
      </div>

      <AdminDataTable
        data={loaderData.rows}
        columns={galleriesColumns}
        searchPlaceholder="갤러리 제목, 카테고리 검색..."
        emptyMessage="등록된 갤러리가 없습니다."
        onDeleteSelected={handleOpenDeleteDialog}
        onRowClick={(row) => navigate(`/admin/gallery/${row.slug}`)}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>갤러리를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              선택된 갤러리 {selectedRows.length}개가 삭제됩니다. 이 작업은
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
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
              >
                삭제
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

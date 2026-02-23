import type { Route } from "./+types/admin-users";
import type { AdminUserRow } from "./server/users.loader";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
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
import { usersAction } from "./server/users.action";
import { usersLoader } from "./server/users.loader";
import { usersColumns } from "./users-columns";

export const meta: Route.MetaFunction = () => {
  return [{ title: `유저 관리 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = usersLoader;
export const action = usersAction;

type ActionResponse =
  | {
      success: true;
      deletedCount: number;
      failed: Array<{ userId: string; error: string }>;
    }
  | {
      success: true;
      operation: "toggle_gallery_access" | "toggle_user_status";
      count: number;
    }
  | { error: string };

/**
 * 유저 관리 페이지
 *
 * 기능:
 * - 유저 목록 테이블 표시 (실제 DB: auth.users + profiles JOIN)
 * - 행 클릭 시 수정 페이지로 이동
 * - 선택 시: 유저 삭제, 포폴 접근 권한 부여
 */
type PendingAction =
  | { type: "toggle_gallery_access"; rows: AdminUserRow[] }
  | { type: "toggle_user_status"; rows: AdminUserRow[] };

export default function AdminUsers({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher<ActionResponse>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<AdminUserRow[]>([]);
  const [galleryConfirmOpen, setGalleryConfirmOpen] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const handleOpenDeleteDialog = (rows: AdminUserRow[]) => {
    if (rows.length === 0) return;
    setSelectedRows(rows);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedRows([]);
  };

  const handleConfirmDelete = () => {
    const userIds = selectedRows.map((row) => row.id);
    fetcher.submit(
      { userIds },
      { method: "DELETE", encType: "application/json" },
    );
  };

  const submitToggle =
    (operation: "toggle_gallery_access" | "toggle_user_status") =>
    (selectedUsers: AdminUserRow[]) => {
      const userIds = selectedUsers.map((u) => u.id);
      fetcher.submit(
        { operation, userIds: JSON.stringify(userIds) },
        { method: "POST" },
      );
    };

  const handleGalleryConfirm = () => {
    if (pendingAction?.type === "toggle_gallery_access") {
      submitToggle("toggle_gallery_access")(pendingAction.rows);
      setPendingAction(null);
      setGalleryConfirmOpen(false);
    }
  };

  const handleStatusConfirm = () => {
    if (pendingAction?.type === "toggle_user_status") {
      submitToggle("toggle_user_status")(pendingAction.rows);
      setPendingAction(null);
      setStatusConfirmOpen(false);
    }
  };

  useEffect(() => {
    if (!fetcher.data) return;

    if ("error" in fetcher.data) {
      handleCloseDeleteDialog();
      toast.error("요청 실패", {
        description: fetcher.data.error,
        duration: 5000,
      });
      return;
    }

    if ("deletedCount" in fetcher.data) {
      const { deletedCount, failed } = fetcher.data;
      handleCloseDeleteDialog();
      if (failed && failed.length > 0) {
        const msg = failed.map((f) => `${f.userId}: ${f.error}`).join("\n");
        toast.warning(`${deletedCount}개 삭제 완료`, {
          description: `실패: ${msg}`,
          duration: 5000,
        });
      } else {
        toast.success(`${deletedCount}명의 유저가 삭제되었습니다.`, {
          duration: 3000,
        });
      }
      return;
    }

    if ("operation" in fetcher.data && fetcher.data.success) {
      const { operation, count } = fetcher.data;
      setPendingAction(null);
      setGalleryConfirmOpen(false);
      setStatusConfirmOpen(false);
      if (operation === "toggle_gallery_access") {
        toast.success(`선택한 ${count}명의 포폴 접근 권한이 변경되었습니다.`, {
          duration: 3000,
        });
      } else {
        toast.success(`선택한 ${count}명의 계정 상태가 변경되었습니다.`, {
          duration: 3000,
        });
      }
    }
  }, [fetcher.data]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mb-4">
        <h1 className="text-h5">유저 관리</h1>
        <p className="text-text-2 mt-2 text-sm">
          유저 목록을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      <AdminDataTable
        data={loaderData.rows}
        columns={usersColumns}
        searchPlaceholder="이메일, 닉네임 검색..."
        emptyMessage="등록된 유저가 없습니다."
        onRowSelectionChange={() => {}}
        onDeleteSelected={handleOpenDeleteDialog}
        customActions={[
          {
            label: "포폴 접근 권한 변경",
            variant: "default",
            className: "hover:!bg-transparent hover:!text-primary hover:!border-primary",
            onClick: (selectedRows) => {
              setPendingAction({ type: "toggle_gallery_access", rows: selectedRows });
              setGalleryConfirmOpen(true);
            },
          },
          {
            label: "상태 변경",
            variant: "outline",
            className:
              "!bg-[#FACC15] !text-white !border-[#FACC15] hover:!bg-transparent hover:!text-[#FACC15] hover:!border-[#FACC15]",
            onClick: (selectedRows) => {
              setPendingAction({ type: "toggle_user_status", rows: selectedRows });
              setStatusConfirmOpen(true);
            },
          },
        ]}
        onRowClick={(row) => {
          navigate(`/admin/users/${row.id}`);
        }}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>유저를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              선택된 유저 {selectedRows.length}명의 프로필이 삭제됩니다.
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
                {fetcher.state === "submitting" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "삭제"
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 포폴 접근 권한 변경 확인 */}
      <AlertDialog open={galleryConfirmOpen} onOpenChange={setGalleryConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>포폴 접근 권한 변경</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {pendingAction?.type === "toggle_gallery_access" ? pendingAction.rows.length : 0}명의 포폴 접근 권한을
              반대로 변경합니다. (허용↔차단)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setPendingAction(null)}>
                취소
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleGalleryConfirm}>확인</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 상태 변경 확인 */}
      <AlertDialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계정 상태 변경</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {pendingAction?.type === "toggle_user_status" ? pendingAction.rows.length : 0}명의 계정 상태를
              반대로 변경합니다. (활성↔정지)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setPendingAction(null)}>
                취소
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleStatusConfirm}>확인</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

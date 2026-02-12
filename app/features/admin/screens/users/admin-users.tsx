import type { Route } from "./+types/admin-users";
import type { AdminUserRow } from "./server/users.loader";

import { useNavigate } from "react-router";

import AdminDataTable from "../../components/admin-data-table";
import { usersAction } from "./server/users.action";
import { usersLoader } from "./server/users.loader";
import { usersColumns } from "./users-columns";

export const meta: Route.MetaFunction = () => {
  return [{ title: `유저 관리 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = usersLoader;
export const action = usersAction;

/**
 * 유저 관리 페이지
 *
 * 기능:
 * - 유저 목록 테이블 표시
 * - 행 클릭 시 수정 페이지로 이동
 * - 선택된 유저에게 포폴 접근 권한 일괄 부여
 */
export default function AdminUsers({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  /**
   * 선택된 유저들에게 포폴 접근 권한 부여
   *
   * @param selectedUsers - 선택된 유저 배열
   */
  const handleGrantGalleryAccess = async (selectedUsers: AdminUserRow[]) => {
    // TODO: Supabase 연동하여 실제 권한 부여 처리
    // gallery_access: false -> true로 변경
    console.log("포폴 접근 권한 부여할 유저:", selectedUsers);

    const userIds = selectedUsers.map((user) => user.id);
    console.log("권한 부여할 유저 ID:", userIds);

    // TODO: Supabase에서 일괄 업데이트
    // await supabase
    //   .from('users')
    //   .update({ gallery_access: true })
    //   .in('id', userIds);

    alert(
      `선택한 ${selectedUsers.length}명의 유저에게 포폴 접근 권한이 부여되었습니다. (임시 메시지)`,
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 pt-0">
      {/* 페이지 헤더 */}
      <div className="mb-4">
        <h1 className="text-h5">유저 관리</h1>
        <p className="text-text-2 mt-2 text-sm">
          유저 목록을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      {/* 유저 테이블 */}
      <AdminDataTable
        data={loaderData.rows}
        columns={usersColumns}
        searchPlaceholder="이메일, 닉네임 검색..."
        emptyMessage="등록된 유저가 없습니다."
        onRowSelectionChange={(selectedRows) => {
          console.log("선택된 유저:", selectedRows);
        }}
        customAction={{
          label: "포폴 접근 권한 부여",
          variant: "default",
          onClick: async (selectedRows) => {
            if (
              confirm(
                `선택한 ${selectedRows.length}명의 유저에게 포폴 접근 권한을 부여하시겠습니까?`,
              )
            ) {
              await handleGrantGalleryAccess(selectedRows);
            }
          },
        }}
        onRowClick={(row) => {
          // 유저 수정 페이지로 이동
          navigate(`/admin/users/${row.id}`);
        }}
      />
    </div>
  );
}

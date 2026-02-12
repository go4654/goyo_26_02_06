import type { Route } from "./+types/classes";

import { Plus } from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";

import AdminDataTable from "../../components/admin-data-table";
import { classesColumns } from "./classes-columns";
import { classesAction } from "./server/classes.action";
import { classesLoader } from "./server/classes.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: `클래스 관리 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = classesLoader;
export const action = classesAction;

export default function Classes({ loaderData }: Route.ComponentProps) {
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
        onRowSelectionChange={(selectedRows) => {
          console.log("선택된 클래스:", selectedRows);
        }}
        onDeleteSelected={async (selectedRows) => {
          // TODO: 실제 삭제 로직 구현
          console.log("삭제할 클래스:", selectedRows);
          // 예시: confirm 다이얼로그 표시
          if (
            confirm(
              `선택한 ${selectedRows.length}개의 클래스를 삭제하시겠습니까?`,
            )
          ) {
            // 삭제 API 호출 또는 action 호출
            // await deleteClasses(selectedRows.map((row) => row.id));
            alert("삭제 기능은 구현 예정입니다.");
          }
        }}
      />
    </div>
  );
}

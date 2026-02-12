import type { Route } from "./+types/galleries";

import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";

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
 * 기능:
 * - 갤러리 목록 테이블 표시
 * - 갤러리 추가 버튼
 * - 행 클릭 시 수정 페이지로 이동
 * - 선택된 행 일괄 삭제
 */
export default function Galleries({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 pt-0">
      {/* 페이지 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-h5">갤러리 관리</h1>

        <Button asChild>
          <Link to="/admin/gallery/new">
            <span>갤러리 추가</span>
            <Plus className="size-4" strokeWidth={1} />
          </Link>
        </Button>
      </div>

      {/* 갤러리 테이블 */}
      <AdminDataTable
        data={loaderData.rows}
        columns={galleriesColumns}
        searchPlaceholder="갤러리 제목, 카테고리 검색..."
        emptyMessage="등록된 갤러리가 없습니다."
        onRowSelectionChange={(selectedRows) => {
          console.log("선택된 갤러리:", selectedRows);
        }}
        onDeleteSelected={async (selectedRows) => {
          // TODO: 실제 삭제 로직 구현
          console.log("삭제할 갤러리:", selectedRows);
          if (
            confirm(
              `선택한 ${selectedRows.length}개의 갤러리를 삭제하시겠습니까?`,
            )
          ) {
            // 삭제 API 호출 또는 action 호출
            // await deleteGalleries(selectedRows.map((row) => row.id));
            alert("삭제 기능은 구현 예정입니다.");
          }
        }}
        onRowClick={(row) => {
          // 갤러리 수정 페이지로 이동
          navigate(`/admin/gallery/${row.id}`);
        }}
      />
    </div>
  );
}

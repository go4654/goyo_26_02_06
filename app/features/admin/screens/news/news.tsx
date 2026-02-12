import type { Route } from "./+types/news";

import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { Button } from "~/core/components/ui/button";

import AdminDataTable from "../../components/admin-data-table";
import { newsColumns } from "./news-columns";
import { newsAction } from "./server/news.action";
import { newsLoader } from "./server/news.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: `뉴스 관리 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = newsLoader;
export const action = newsAction;

/**
 * 뉴스 관리 페이지
 *
 * 기능:
 * - 뉴스 목록 테이블 표시
 * - 뉴스 추가 버튼
 * - 행 클릭 시 수정 페이지로 이동
 * - 선택된 행 일괄 삭제
 */
export default function News({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 pt-0">
      {/* 페이지 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-h5">뉴스 관리</h1>

        <Button asChild>
          <Link to="/admin/news/new">
            <span>뉴스 추가</span>
            <Plus className="size-4" strokeWidth={1} />
          </Link>
        </Button>
      </div>

      {/* 뉴스 테이블 */}
      <AdminDataTable
        data={loaderData.rows}
        columns={newsColumns}
        searchPlaceholder="뉴스 제목, 카테고리 검색..."
        emptyMessage="등록된 뉴스가 없습니다."
        onRowSelectionChange={(selectedRows) => {
          console.log("선택된 뉴스:", selectedRows);
        }}
        onDeleteSelected={async (selectedRows) => {
          // TODO: 실제 삭제 로직 구현
          console.log("삭제할 뉴스:", selectedRows);
          if (
            confirm(
              `선택한 ${selectedRows.length}개의 뉴스를 삭제하시겠습니까?`,
            )
          ) {
            // 삭제 API 호출 또는 action 호출
            // await deleteNews(selectedRows.map((row) => row.id));
            alert("삭제 기능은 구현 예정입니다.");
          }
        }}
        onRowClick={(row) => {
          // 뉴스 수정 페이지로 이동
          navigate(`/admin/news/${row.id}`);
        }}
      />
    </div>
  );
}

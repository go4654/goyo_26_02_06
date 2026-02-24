import type { Route } from "./+types/admin-inquiries";

import { useNavigate } from "react-router";

import AdminDataTable from "../../components/admin-data-table";
import { adminInquiriesLoader } from "./server/admin-inquiries.loader";
import { inquiriesColumns } from "./inquiries-columns";

export const meta: Route.MetaFunction = () => {
  return [{ title: `문의 관리 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = adminInquiriesLoader;

/**
 * 관리자 문의 목록 페이지
 *
 * - 문의 테이블 실제 DB 데이터 바인딩 (get_admin_inquiries_list RPC)
 * - 행 클릭 시 /admin/users/inquiries/:id 상세 페이지로 이동
 * - 제목 클릭 시에도 상세 페이지 이동
 */
export default function AdminInquiries({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-h5">문의 관리</h1>
      </div>

      <AdminDataTable
        data={loaderData.rows}
        columns={inquiriesColumns}
        searchPlaceholder="제목, 이메일, 닉네임 검색..."
        emptyMessage="문의 내역이 없습니다."
        onRowClick={(row) => navigate(`/admin/users/inquiries/${row.id}`)}
      />
    </div>
  );
}

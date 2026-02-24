import type { Route } from "./+types/admin-inquiries-detail";

import { adminInquiriesDetailLoader } from "./server/admin-inquiries-detail.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: `문의 상세 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = adminInquiriesDetailLoader;

/**
 * 관리자 문의 상세 페이지
 *
 * 페이지 이동만 지원합니다. 상세 UI는 추후 구성합니다.
 */
export default function AdminInquiriesDetail({
  loaderData,
}: Route.ComponentProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 pt-0">
      <p className="text-text-2">문의 ID: {loaderData.id}</p>
    </div>
  );
}

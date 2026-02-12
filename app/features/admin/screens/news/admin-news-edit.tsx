import type { Route } from "./+types/admin-news-edit";

import { useNavigate } from "react-router";

import AdminContentForm, {
  type ContentFormData,
} from "../../components/admin-content-form";
import { newsDetailLoader } from "./server/news-detail.loader";
import { newsAction } from "./server/news.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `뉴스 수정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = newsDetailLoader;
export const action = newsAction;

/**
 * 뉴스 수정 페이지
 *
 * 기능:
 * - 기존 뉴스 데이터를 폼에 자동으로 채움
 * - 수정된 내용을 저장
 * - 취소 시 목록 페이지로 이동
 */
export default function NewsEdit({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { news: newsData } = loaderData;

  /**
   * 폼 제출 핸들러
   * 수정된 뉴스 데이터를 처리합니다.
   */
  const handleSubmit = async (data: ContentFormData) => {
    // TODO: Supabase 연동하여 실제 수정 처리
    console.log("뉴스 수정 데이터:", {
      id: newsData.id,
      title: data.title,
      description: data.description,
      tags: data.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      content: data.content,
      isVisible: data.isVisible,
    });

    // 임시: 성공 메시지 표시 후 목록으로 이동
    alert("뉴스가 수정되었습니다. (임시 메시지)");
    navigate("/admin/news");
  };

  /**
   * 취소 핸들러
   * 목록 페이지로 이동합니다.
   */
  const handleCancel = () => {
    navigate("/admin/news");
  };

  /**
   * 로더에서 가져온 뉴스 데이터를 폼 데이터 형식으로 변환
   * tags 배열을 쉼표로 구분된 문자열로 변환
   */
  const initialFormData: ContentFormData = {
    title: newsData.title,
    description: newsData.description,
    tags: newsData.tags.join(", "), // 배열을 쉼표로 구분된 문자열로 변환
    content: newsData.content,
    isVisible: newsData.isVisible,
  };

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-4 pt-0">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-h5">뉴스 수정</h1>
        <p className="text-text-2 mt-2 text-sm">
          뉴스 정보를 수정합니다. MDX 형식으로 콘텐츠를 작성할 수 있습니다.
        </p>
      </div>

      {/* 폼 영역 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <AdminContentForm
          initialData={initialFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="수정 완료"
        />
      </div>
    </div>
  );
}

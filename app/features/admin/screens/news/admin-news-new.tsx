import type { Route } from "./+types/admin-news-new";

import { useNavigate } from "react-router";

import AdminContentForm, {
  type ContentFormData,
} from "../../components/admin-content-form";
import { newsAction } from "./server/news.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `뉴스 추가 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const action = newsAction;

/**
 * 뉴스 등록 페이지
 *
 * 기능:
 * - 새로운 뉴스를 등록하는 폼 제공
 * - 타이틀, 설명, 태그, MDX 콘텐츠, 공개 여부 입력
 * - 등록 완료 후 목록 페이지로 이동
 *
 * 재사용성:
 * - AdminContentForm 컴포넌트를 사용하여 클래스, 갤러리 등에서도 동일한 구조로 재사용 가능
 */
export default function NewsNew() {
  const navigate = useNavigate();

  /**
   * 폼 제출 핸들러
   * 뉴스 등록 데이터를 처리합니다.
   *
   * @param data - 폼에서 입력된 뉴스 데이터
   */
  const handleSubmit = async (data: ContentFormData) => {
    // TODO: Supabase 연동하여 실제 등록 처리
    console.log("뉴스 등록 데이터:", {
      title: data.title,
      description: data.description,
      tags: data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      content: data.content,
      isVisible: data.isVisible,
    });

    // 임시: 성공 메시지 표시 후 목록으로 이동
    alert("뉴스가 등록되었습니다. (임시 메시지)");
    navigate("/admin/news");
  };

  /**
   * 취소 핸들러
   * 목록 페이지로 이동합니다.
   */
  const handleCancel = () => {
    navigate("/admin/news");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-4 pt-0">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-h5">뉴스 추가</h1>
        <p className="text-text-2 mt-2 text-sm">
          새로운 뉴스를 등록합니다. MDX 형식으로 콘텐츠를 작성할 수 있습니다.
        </p>
      </div>

      {/* 폼 영역 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <AdminContentForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="뉴스 등록"
        />
      </div>
    </div>
  );
}

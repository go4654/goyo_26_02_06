import type { Route } from "./+types/classes-new";

import { useNavigate } from "react-router";

import AdminContentForm, {
  type ContentFormData,
} from "../../components/admin-content-form";
import { classesAction } from "./server/classes.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `클래스 추가 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const action = classesAction;

export default function ClassesNew() {
  const navigate = useNavigate();

  const handleSubmit = async (data: ContentFormData) => {
    // TODO: Supabase 연동하여 실제 등록 처리
    console.log("클래스 등록 데이터:", {
      title: data.title,
      description: data.description,
      tags: data.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      content: data.content,
    });

    // 임시: 성공 메시지 표시 후 목록으로 이동
    alert("클래스가 등록되었습니다. (임시 메시지)");
    navigate("/admin/classes");
  };

  const handleCancel = () => {
    navigate("/admin/classes");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-h5">클래스 추가</h1>
        <p className="text-text-2 mt-2 text-sm">
          새로운 클래스를 등록합니다. MDX 형식으로 콘텐츠를 작성할 수 있습니다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <AdminContentForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="클래스 등록"
        />
      </div>
    </div>
  );
}

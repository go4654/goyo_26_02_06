import type { Route } from "./+types/admin-classes-edit";

import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { toast } from "sonner";

import AdminContentForm, {
  type ContentFormData,
  type PendingImage,
  type SubCategory,
} from "../../components/admin-content-form";
import { compressImageToWebp } from "../../utils/image-upload";
import { classDetailLoader } from "./server/classes-detail.loader";
import { classesUpdateAction } from "./server/classes-update.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `클래스 수정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = classDetailLoader;
export const action = classesUpdateAction;

/** 액션 응답 타입 */
type ActionResponse = { success: true; slug: string } | { error: string };

/**
 * 클래스 수정 페이지
 *
 * - 기존 데이터 로드 후 폼에 반영, 실제 썸네일 URL로 미리보기 표시
 * - 수정 시 썸네일·MDX 이미지·태그·DB 안전 동기화
 */
export default function ClassesEdit({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher<ActionResponse>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const { class: classData } = loaderData;

  const handleSubmit = async (
    data: ContentFormData,
    thumbnailFile: File | null,
  ) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description ?? "");
      formData.append("category", data.category);
      formData.append("tags", data.tags ?? "");
      formData.append("content", data.content);
      formData.append("isPublished", data.isVisible ? "true" : "false");

      if (thumbnailFile && thumbnailFile.size > 0) {
        try {
          const compressed = await compressImageToWebp(thumbnailFile);
          formData.append("thumbnail", compressed);
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "이미지 압축에 실패했습니다. 다시 시도해주세요.",
          );
          setIsSubmitting(false);
          return;
        }
      }

      pendingImages.forEach((pending) => {
        formData.append("contentImages", pending.file);
        formData.append("contentImageTempIds", pending.tempId);
      });

      fetcher.submit(formData, {
        method: "POST",
        encType: "multipart/form-data",
      });
    } catch {
      toast.error("클래스 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      toast.success("클래스가 성공적으로 수정되었습니다.");
      navigate("/admin/classes");
    }
    if (fetcher.data && "error" in fetcher.data && fetcher.data.error) {
      if (!isSubmitting) setIsSubmitting(false);
      toast.error("클래스 수정 실패", {
        description: fetcher.data.error,
      });
    }
  }, [fetcher.data, isSubmitting, navigate]);

  const handleCancel = () => {
    navigate("/admin/classes");
  };

  const initialFormData: ContentFormData = {
    title: classData.title,
    description: classData.description ?? "",
    category: classData.category as SubCategory,
    tags: classData.tags.join(", "),
    content: classData.content,
    isVisible: classData.isVisible,
    thumbnailImageUrl: classData.thumbnail_image_url ?? undefined,
  };

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-h5">클래스 수정</h1>
        <p className="text-text-2 mt-2 text-sm">
          클래스 정보를 수정합니다. MDX 형식으로 콘텐츠를 작성할 수 있습니다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <AdminContentForm
          initialData={initialFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="수정 완료"
          classId={classData.id}
          isLoading={isSubmitting || fetcher.state === "submitting"}
          onPendingImagesChange={(updater) => {
            setPendingImages((prev) => updater(prev));
          }}
        />
      </div>
    </div>
  );
}

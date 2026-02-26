import type { Route } from "./+types/admin-classes-new";

import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { toast } from "sonner";

import AdminContentForm, {
  type ContentFormData,
  type PendingImage,
} from "../../components/admin-content-form";
import { compressImageToWebp } from "../../utils/image-upload";
import { classesAction } from "./server/classes.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `클래스 추가 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const action = classesAction;

/**
 * 클래스 등록 페이지
 *
 * 기능:
 * - 새로운 클래스를 등록하는 폼 제공
 * - 타이틀, 설명, 태그, MDX 콘텐츠, 공개 여부 입력
 * - 썸네일 이미지 업로드 (webp 압축)
 * - 등록 완료 후 목록 페이지로 이동
 *
 * 재사용성:
 * - AdminContentForm 컴포넌트를 사용하여 갤러리, 뉴스 등에서도 동일한 구조로 재사용 가능
 */
/**
 * 액션 응답 타입
 */
type ActionResponse =
  | { success: true; classId: string; slug: string }
  | { error: string };

export default function ClassesNew() {
  const navigate = useNavigate();
  const fetcher = useFetcher<ActionResponse>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  /**
   * 폼 제출 핸들러
   * 클래스 등록 데이터를 처리합니다.
   *
   * @param data - 폼에서 입력된 클래스 데이터
   * @param thumbnailFile - 썸네일 이미지 파일 (압축 전)
   */
  const handleSubmit = async (
    data: ContentFormData,
    thumbnailFile: File | null,
  ) => {
    setIsSubmitting(true);

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("category", data.category);
      formData.append("tags", data.tags || "");
      formData.append("content", data.content);
      formData.append("isPublished", data.isVisible ? "true" : "false");

      // 썸네일 이미지 압축 및 추가
      if (thumbnailFile) {
        try {
          const compressedFile = await compressImageToWebp(thumbnailFile);
          formData.append("thumbnail", compressedFile);
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

      // MDX 콘텐츠 이미지 파일들 추가 (클래스 생성 전에 선택한 이미지들)
      if (pendingImages.length > 0) {
        pendingImages.forEach((pendingImage, index) => {
          formData.append(`contentImages`, pendingImage.file);
          formData.append(`contentImageTempIds`, pendingImage.tempId);
        });
      }

      // 서버에 전송
      fetcher.submit(formData, {
        method: "POST",
        encType: "multipart/form-data",
      });
    } catch {
      toast.error("클래스 등록 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // 액션 결과 처리
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      toast.success("클래스가 성공적으로 등록되었습니다.");
      // 성공 시 목록 페이지로 이동
      navigate("/admin/classes");
    }

    // 에러 처리
    if (fetcher.data && "error" in fetcher.data) {
      const errorMessage = fetcher.data.error;
      if (errorMessage && !isSubmitting) {
        toast.error("클래스 등록 실패", {
          description: errorMessage,
        });
        setIsSubmitting(false);
      }
    }
  }, [fetcher.data, isSubmitting, navigate]);

  /**
   * 취소 핸들러
   * 목록 페이지로 이동합니다.
   */
  const handleCancel = () => {
    navigate("/admin/classes");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-4 pt-0">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-h5">클래스 추가</h1>
        <p className="text-text-2 mt-2 text-sm">
          새로운 클래스를 등록합니다. MDX 형식으로 콘텐츠를 작성할 수 있습니다.
        </p>
      </div>

      {/* 폼 영역 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <AdminContentForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="클래스 등록"
          isLoading={isSubmitting || fetcher.state === "submitting"}
          onPendingImagesChange={(updater) => {
            setPendingImages((prev) => updater(prev));
          }}
        />
      </div>
    </div>
  );
}

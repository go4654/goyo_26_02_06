import type { Route } from "./+types/admin-news-new";

import { Image, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useNavigate } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Label } from "~/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";

import AdminContentForm, {
  type ContentFormData,
  type PendingImage,
} from "../../components/admin-content-form";
import { compressImageToWebp } from "../../utils/image-upload";
import {
  NEWS_CATEGORIES,
  NEWS_CATEGORY_LABELS,
  type NewsCategory,
} from "~/features/news/constants/news-categories";
import { newsCreateAction } from "./server/news-create.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `뉴스 추가 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const action = newsCreateAction;

type ActionResponse =
  | { success: true; newsId: string }
  | { error: string };

/**
 * 뉴스 등록 페이지
 *
 * - 썸네일·커버·MDX 이미지 업로드 (클래스와 동일 구조)
 * - 성공 시 /admin/news 이동
 */
export default function NewsNew() {
  const navigate = useNavigate();
  const fetcher = useFetcher<ActionResponse>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [newsCategory, setNewsCategory] = useState<NewsCategory>("notice");

  const handleSubmit = async (
    data: ContentFormData,
    thumbnailFile: File | null,
  ) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("category", newsCategory);
      formData.append("content", data.content);
      formData.append("isPublished", data.isVisible ? "true" : "false");
      formData.append("visibility", data.visibility ?? "public");

      if (thumbnailFile) {
        const compressed = await compressImageToWebp(thumbnailFile);
        formData.append("thumbnail", compressed);
      }

      if (coverFile) {
        const compressed = await compressImageToWebp(coverFile);
        formData.append("cover", compressed);
      }

      if (pendingImages.length > 0) {
        pendingImages.forEach((p) => {
          formData.append("contentImages", p.file);
          formData.append("contentImageTempIds", p.tempId);
        });
      }

      fetcher.submit(formData, {
        method: "POST",
        encType: "multipart/form-data",
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!fetcher.data) return;

    if ("success" in fetcher.data && fetcher.data.success) {
      navigate("/admin/news");
      return;
    }

    if ("error" in fetcher.data && fetcher.data.error) {
      alert(fetcher.data.error);
      setIsSubmitting(false);
    }
  }, [fetcher.data, navigate]);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) return;
    if (coverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverPreview(URL.createObjectURL(file));
    setCoverFile(file);
  };

  const handleCoverRemove = () => {
    if (coverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverPreview(null);
    setCoverFile(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleCancel = () => {
    navigate("/admin/news");
  };

  const isLoading = isSubmitting || fetcher.state === "submitting";

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-h5">뉴스 추가</h1>
        <p className="text-text-2 mt-2 text-sm">
          새로운 뉴스를 등록합니다. MDX 형식으로 콘텐츠를 작성할 수 있습니다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        {/* 뉴스 카테고리 (notice | update | news) */}
        <div className="mb-6 space-y-2">
          <Label>
            카테고리 <span className="text-destructive">*</span>
          </Label>
          <Select
            value={newsCategory}
            onValueChange={(value: NewsCategory) => setNewsCategory(value)}
          >
            <SelectTrigger className="w-full max-w-[200px]">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              {NEWS_CATEGORIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {NEWS_CATEGORY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AdminContentForm
          variant="news"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="뉴스 등록"
          isLoading={isLoading}
          onPendingImagesChange={(updater) =>
            setPendingImages((prev) => updater(prev))
          }
        />

        {/* 커버 이미지 (선택) */}
        <div className="mt-6 space-y-2 border-t border-white/10 pt-6">
          <Label>커버 이미지 (선택)</Label>
          <div className="flex flex-col gap-3">
            {coverPreview ? (
              <div className="relative inline-block">
                <div className="relative h-40 w-full max-w-md overflow-hidden rounded-lg border border-white/10">
                  <img
                    src={coverPreview}
                    alt="커버 미리보기"
                    className="h-full w-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 size-6"
                  onClick={handleCoverRemove}
                  aria-label="커버 제거"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex h-32 w-full max-w-md items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5">
                <div className="flex flex-col items-center gap-2">
                  <Image className="text-text-3 size-8" />
                  <p className="text-text-3 text-sm">커버 이미지를 선택하세요</p>
                </div>
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverSelect}
              className="hidden"
              aria-label="커버 이미지 선택"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                disabled={isLoading}
              >
                <Image className="mr-2 size-4" />
                {coverPreview ? "커버 변경" : "커버 선택"}
              </Button>
              {coverPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCoverRemove}
                  disabled={isLoading}
                >
                  <X className="mr-2 size-4" />
                  제거
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

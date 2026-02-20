import type { Route } from "./+types/admin-gallery-new";

import { useEffect, useRef, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { Image, X } from "lucide-react";

import {
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_LABELS,
  type GalleryCategory,
} from "~/features/gallery/constants";

import { Button } from "~/core/components/ui/button";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { Textarea } from "~/core/components/ui/textarea";

import MDXEditor, { type PendingImage } from "../../components/mdx-editor";
import { compressImageToWebp } from "../../utils/image-upload";
import { galleriesCreateAction } from "./server/galleries-create.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `갤러리 추가 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const action = galleriesCreateAction;

type ActionResponse =
  | { success: true; galleryId: string }
  | { error: string };

/** 갤러리 등록 폼: 클래스 description=subtitle, content_mdx=description, caption=추가 MDX */
interface GalleryFormData {
  title: string;
  subtitle: string;
  category: GalleryCategory;
  tags: string;
  description: string;
  caption: string;
  isVisible: boolean;
}

const INITIAL_FORM: GalleryFormData = {
  title: "",
  subtitle: "",
  category: "design",
  tags: "",
  description: "",
  caption: "",
  isVisible: true,
};

/**
 * 갤러리 등록 페이지
 *
 * - subtitle(짧은 설명) = 클래스 description
 * - description(MDX) = 클래스 content_mdx (본문)
 * - caption(MDX) = 갤러리만의 추가 MDX
 * - 썸네일 UX는 클래스와 완전 동일
 */
export default function GalleryNew(_props: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher<ActionResponse>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [formData, setFormData] = useState<GalleryFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof GalleryFormData, string>>>({});
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof GalleryFormData>(
    field: K,
    value: GalleryFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof GalleryFormData, string>> = {};
    if (!formData.title.trim()) newErrors.title = "타이틀을 입력해주세요.";
    if (!formData.description.trim()) newErrors.description = "본문(설명)을 입력해주세요.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const form = new FormData();
      form.append("title", formData.title);
      form.append("subtitle", formData.subtitle || "");
      form.append("description", formData.description || "");
      form.append("caption", formData.caption || "");
      form.append("category", formData.category);
      form.append("tags", formData.tags || "");
      form.append("isPublished", formData.isVisible ? "true" : "false");

      if (thumbnailFile) {
        const compressed = await compressImageToWebp(thumbnailFile);
        form.append("thumbnail", compressed);
      }
      pendingImages.forEach((p) => {
        form.append("contentImages", p.file);
        form.append("contentImageTempIds", p.tempId);
      });

      fetcher.submit(form, { method: "POST", encType: "multipart/form-data" });
    } catch {
      alert("갤러리 등록 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const data = fetcher.data;
    if (!data) return;
    if ("success" in data && data.success) {
      navigate("/admin/gallery");
      return;
    }
    if ("error" in data && data.error) {
      alert(data.error);
      setIsSubmitting(false);
    }
  }, [fetcher.data, navigate]);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }
    if (thumbnailPreview?.startsWith("blob:")) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(URL.createObjectURL(file));
    setThumbnailFile(file);
  };

  const handleThumbnailRemove = () => {
    if (thumbnailPreview?.startsWith("blob:")) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    setThumbnailFile(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handleThumbnailUploadClick = () => {
    thumbnailInputRef.current?.click();
  };

  const isLoading = isSubmitting || fetcher.state === "submitting";

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-h5">갤러리 추가</h1>
        <p className="text-text-2 mt-2 text-sm">
          새로운 갤러리를 등록합니다. MDX 형식으로 콘텐츠를 작성할 수 있습니다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 썸네일 이미지 (클래스와 동일 UX) */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">썸네일 이미지</Label>
            <div className="space-y-3">
              {thumbnailPreview ? (
                <div className="relative inline-block">
                  <div className="relative h-48 w-48 overflow-hidden rounded-lg border border-white/10">
                    <img
                      src={thumbnailPreview}
                      alt="썸네일 미리보기"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 size-6"
                    onClick={handleThumbnailRemove}
                    aria-label="썸네일 제거"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5">
                  <div className="flex flex-col items-center gap-2">
                    <Image className="text-text-3 size-8" />
                    <p className="text-text-3 text-sm">이미지를 선택해주세요</p>
                  </div>
                </div>
              )}

              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
                id="thumbnail"
                aria-label="썸네일 이미지 선택"
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleThumbnailUploadClick}
                  disabled={isLoading}
                >
                  <Image className="mr-2 size-4" />
                  {thumbnailPreview ? "이미지 변경" : "이미지 선택"}
                </Button>
                {thumbnailPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleThumbnailRemove}
                    disabled={isLoading}
                  >
                    <X className="mr-2 size-4" />
                    제거
                  </Button>
                )}
              </div>

              <p className="text-text-3 text-xs">
                이미지 파일만 업로드 가능합니다. (최대 10MB)
                {thumbnailFile && (
                  <span className="ml-2">
                    선택된 파일: {thumbnailFile.name} (
                    {(thumbnailFile.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 타이틀 */}
          <div className="space-y-2">
            <Label htmlFor="title">타이틀 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="갤러리 제목"
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-destructive text-sm">{errors.title}</p>}
          </div>

          {/* 서브타이틀 (클래스 description과 동일 용도) */}
          <div className="space-y-2">
            <Label htmlFor="subtitle">서브타이틀 (짧은 설명)</Label>
            <Textarea
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              placeholder="간단한 한 줄 설명"
              rows={2}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label htmlFor="category">카테고리 *</Label>
            <Select
              value={formData.category}
              onValueChange={(v) => updateField("category", v as GalleryCategory)}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {GALLERY_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {GALLERY_CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 태그 */}
          <div className="space-y-2">
            <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => updateField("tags", e.target.value)}
              placeholder="예: design, uxui"
            />
          </div>

          {/* 본문 MDX (클래스 content_mdx = 갤러리 description) */}
          <div className="space-y-2">
            <Label htmlFor="description">본문 (MDX) *</Label>
            <MDXEditor
              value={formData.description}
              onChange={(value) => updateField("description", value)}
              placeholder="MDX 코드를 입력하세요..."
              error={errors.description}
              onPendingImagesChange={(updater) => setPendingImages((prev) => updater(prev))}
            />
            {errors.description && (
              <p className="text-destructive text-sm">{errors.description}</p>
            )}
          </div>

          {/* 캡션 MDX (갤러리만의 추가 MDX) */}
          <div className="space-y-2">
            <Label htmlFor="caption">캡션 (MDX, 선택)</Label>
            <MDXEditor
              value={formData.caption}
              onChange={(value) => updateField("caption", value)}
              placeholder="추가 MDX (선택 사항)"
              onPendingImagesChange={(updater) => setPendingImages((prev) => updater(prev))}
            />
          </div>

          {/* 공개 여부 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isVisible"
              checked={formData.isVisible}
              onCheckedChange={(checked) => updateField("isVisible", checked === true)}
            />
            <Label htmlFor="isVisible" className="cursor-pointer text-sm font-normal">
              공개 여부
            </Label>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/gallery")}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "처리 중..." : "갤러리 등록"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

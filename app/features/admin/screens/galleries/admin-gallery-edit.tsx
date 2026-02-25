import type { Route } from "./+types/admin-gallery-edit";

import { Image, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { toast } from "sonner";

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
import {
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_LABELS,
  type GalleryCategory,
  isGalleryCategory,
} from "~/features/gallery/constants";

import MDXEditor, { type PendingImage } from "../../components/mdx-editor";
import { MDX_EX_TEXT } from "../../constants/mdx-ex-text";
import { compressImageToWebp } from "../../utils/image-upload";
import { galleryDetailLoader } from "./server/galleries-detail.loader";
import { galleriesUpdateAction } from "./server/galleries-update.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `갤러리 수정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = galleryDetailLoader;
export const action = galleriesUpdateAction;

type ActionResponse = { success: true; slug: string } | { error: string };

/** 갤러리 수정 폼 (description=본문 MDX, caption=추가 MDX) */
interface GalleryEditFormData {
  title: string;
  subtitle: string;
  category: GalleryCategory;
  tags: string;
  description: string;
  caption: string;
  isVisible: boolean;
}

/**
 * 갤러리 수정 페이지
 * 클래스 수정과 동일 패턴: 썸네일·MDX·image_urls·태그 스토리지 동기화 + 원자성
 */
export default function GalleryEdit({ loaderData }: Route.ComponentProps) {
  const { gallery } = loaderData;
  const navigate = useNavigate();
  const fetcher = useFetcher<ActionResponse>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [formData, setFormData] = useState<GalleryEditFormData>({
    title: gallery.title,
    subtitle: gallery.subtitle ?? "",
    category: isGalleryCategory(gallery.category)
      ? (gallery.category as GalleryCategory)
      : "design",
    tags: gallery.tags.join(", "),
    description: gallery.description ?? "",
    caption: gallery.caption ?? "",
    isVisible: gallery.isVisible,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof GalleryEditFormData, string>>
  >({});
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    gallery.thumbnail_image_url ?? null,
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [keptImageUrls, setKeptImageUrls] = useState<string[]>(
    gallery.image_urls ?? [],
  );
  const [newGalleryImageFiles, setNewGalleryImageFiles] = useState<File[]>([]);
  const galleryImageInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof GalleryEditFormData>(
    field: K,
    value: GalleryEditFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof GalleryEditFormData, string>> = {};
    if (!formData.title.trim()) newErrors.title = "타이틀을 입력해주세요.";
    if (!formData.description.trim())
      newErrors.description = "본문(설명)을 입력해주세요.";
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

      if (thumbnailFile && thumbnailFile.size > 0) {
        const compressed = await compressImageToWebp(thumbnailFile);
        form.append("thumbnail", compressed);
      }
      keptImageUrls.forEach((url) => form.append("keptImageUrls", url));
      newGalleryImageFiles.forEach((file) =>
        form.append("galleryImages", file),
      );
      pendingImages.forEach((p) => {
        form.append("contentImages", p.file);
        form.append("contentImageTempIds", p.tempId);
      });

      fetcher.submit(form, {
        method: "POST",
        encType: "multipart/form-data",
      });
    } catch {
      toast.error("갤러리 수정 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const data = fetcher.data;
    if (!data) return;
    if ("success" in data && data.success) {
      toast.success("갤러리가 수정되었습니다.");
      navigate("/admin/gallery");
      return;
    }
    if ("error" in data && data.error) {
      toast.error(data.error);
      setIsSubmitting(false);
    }
  }, [fetcher.data, navigate]);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("파일 크기는 10MB 이하여야 합니다.");
      return;
    }
    if (thumbnailPreview?.startsWith("blob:"))
      URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(URL.createObjectURL(file));
    setThumbnailFile(file);
  };

  const handleThumbnailRemove = () => {
    if (thumbnailPreview?.startsWith("blob:"))
      URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    setThumbnailFile(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handleThumbnailUploadClick = () => thumbnailInputRef.current?.click();

  const removeKeptImage = (index: number) => {
    setKeptImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const addGalleryImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const valid = files.filter(
      (f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024,
    );
    setNewGalleryImageFiles((prev) => [...prev, ...valid]);
    if (galleryImageInputRef.current) galleryImageInputRef.current.value = "";
  };

  const removeNewGalleryImage = (index: number) => {
    setNewGalleryImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isLoading = isSubmitting || fetcher.state === "submitting";

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-h5">갤러리 수정</h1>
        <p className="text-text-2 mt-2 text-sm">
          갤러리 정보를 수정합니다. MDX 형식으로 콘텐츠를 작성할 수 있습니다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 썸네일 (클래스와 동일 UX) */}
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
                    className="absolute -top-2 -right-2 size-6"
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

          <div className="space-y-2">
            <Label htmlFor="title">타이틀 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="갤러리 제목"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-destructive text-sm">{errors.title}</p>
            )}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="category">카테고리 *</Label>
            <Select
              value={formData.category}
              onValueChange={(v) =>
                updateField("category", v as GalleryCategory)
              }
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

          <div className="space-y-2">
            <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => updateField("tags", e.target.value)}
              placeholder="예: design, uxui"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">본문 (MDX) *</Label>
            <MDXEditor
              value={formData.description}
              onChange={(value) => updateField("description", value)}
              placeholder={MDX_EX_TEXT}
              error={errors.description}
              onPendingImagesChange={(updater) =>
                setPendingImages((prev) => updater(prev))
              }
            />
            {errors.description && (
              <p className="text-destructive text-sm">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">캡션 (MDX, 선택)</Label>
            <MDXEditor
              value={formData.caption}
              onChange={(value) => updateField("caption", value)}
              placeholder="추가 MDX (선택 사항)"
              onPendingImagesChange={(updater) =>
                setPendingImages((prev) => updater(prev))
              }
            />
          </div>

          {/* 갤러리 이미지 (image_urls) */}
          <div className="space-y-2">
            <Label>갤러리 이미지</Label>
            <p className="text-text-3 text-xs">
              기존 이미지 제거 시 저장 후 해당 파일이 Storage에서 삭제됩니다. 새
              이미지는 추가 시 업로드됩니다.
            </p>
            <div className="flex flex-wrap gap-3">
              {keptImageUrls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-white/10"
                >
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 size-6"
                    onClick={() => removeKeptImage(index)}
                    aria-label="이미지 제거"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
              {newGalleryImageFiles.map((file, index) => (
                <div
                  key={`new-${index}`}
                  className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-white/10"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 size-6"
                    onClick={() => removeNewGalleryImage(index)}
                    aria-label="새 이미지 제거"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
            <input
              ref={galleryImageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={addGalleryImages}
              className="hidden"
              aria-label="갤러리 이미지 추가"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => galleryImageInputRef.current?.click()}
              disabled={isLoading}
            >
              <Image className="mr-2 size-4" />
              이미지 추가
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isVisible"
              checked={formData.isVisible}
              onCheckedChange={(checked) =>
                updateField("isVisible", checked === true)
              }
            />
            <Label
              htmlFor="isVisible"
              className="cursor-pointer text-sm font-normal"
            >
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
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "수정 완료"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

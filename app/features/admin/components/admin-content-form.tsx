import { useRef, useState } from "react";

import { Image, X } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";

import MDXEditor from "./mdx-editor";

/**
 * 콘텐츠 폼 데이터 타입
 */
export interface ContentFormData {
  title: string;
  description: string;
  tags: string; // 쉼표로 구분된 태그 문자열 (예: "design, uxui")
  content: string; // MDX 코드
  isVisible: boolean; // 공개 여부
  thumbnailImageUrl?: string; // 썸네일 이미지 URL (초기값용, 선택적)
}

/**
 * 썸네일 이미지 파일 정보
 * 나중에 버킷에 업로드할 수 있도록 File 객체를 별도로 관리합니다.
 */
export interface ThumbnailImageFile {
  file: File;
  previewUrl: string;
}

/**
 * AdminContentForm Props
 * 갤러리, 뉴스, 클래스 등 다양한 콘텐츠 등록에 재사용 가능한 폼 컴포넌트
 */
interface AdminContentFormProps {
  /** 초기 폼 데이터 */
  initialData?: Partial<ContentFormData>;
  /** 폼 제출 콜백 */
  onSubmit: (data: ContentFormData) => void | Promise<void>;
  /** 취소 버튼 클릭 콜백 */
  onCancel?: () => void;
  /** 제출 버튼 텍스트 */
  submitLabel?: string;
  /** 취소 버튼 텍스트 */
  cancelLabel?: string;
  /** 로딩 상태 */
  isLoading?: boolean;
}

/**
 * AdminContentForm - 재사용 가능한 콘텐츠 등록 폼
 *
 * 포함 필드:
 * - 타이틀: 콘텐츠 제목
 * - 설명: 콘텐츠에 대한 간단한 설명
 * - 태그: 쉼표로 구분된 태그들 (예: "design, uxui")
 * - 콘텐츠: MDX 형식의 본문 내용
 * - 공개 여부: 체크박스로 공개/비공개 설정
 *
 * @example
 * ```tsx
 * <AdminContentForm
 *   onSubmit={async (data) => {
 *     await createContent(data);
 *   }}
 *   onCancel={() => navigate(-1)}
 * />
 * ```
 */
export default function AdminContentForm({
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = "등록",
  cancelLabel = "취소",
  isLoading = false,
}: AdminContentFormProps) {
  const [formData, setFormData] = useState<ContentFormData>({
    title: initialData.title || "",
    description: initialData.description || "",
    tags: initialData.tags || "",
    content: initialData.content || "",
    isVisible: initialData.isVisible ?? true, // 기본값: 공개
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ContentFormData, string>>
  >({});

  // 썸네일 이미지 관련 상태
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData.thumbnailImageUrl || null,
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    const newErrors: Partial<Record<keyof ContentFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "타이틀을 입력해주세요.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "설명을 입력해주세요.";
    }

    if (!formData.content.trim()) {
      newErrors.content = "콘텐츠를 입력해주세요.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit(formData);
  };

  const updateField = <K extends keyof ContentFormData>(
    field: K,
    value: ContentFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 에러 초기화
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * 썸네일 이미지 파일 선택 핸들러
   * 파일 선택 시 미리보기 URL을 생성하고 File 객체를 저장합니다.
   */
  const handleThumbnailSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일인지 확인
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 확인 (10MB 제한)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    // 미리보기 URL 생성
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
    setThumbnailFile(file);
  };

  /**
   * 썸네일 이미지 제거 핸들러
   */
  const handleThumbnailRemove = () => {
    // 미리보기 URL 정리
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(null);
    setThumbnailFile(null);
    // 파일 입력 초기화
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  };

  /**
   * 썸네일 업로드 버튼 클릭 핸들러
   */
  const handleThumbnailUploadClick = () => {
    thumbnailInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 썸네일 이미지 */}
      <div className="space-y-2">
        <Label htmlFor="thumbnail">썸네일 이미지</Label>
        <div className="space-y-3">
          {/* 미리보기 영역 */}
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

          {/* 파일 입력 (숨김) */}
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailSelect}
            className="hidden"
            id="thumbnail"
            aria-label="썸네일 이미지 선택"
          />

          {/* 업로드 버튼 */}
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
        <Label htmlFor="title">
          타이틀 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="예: 비전공자도 칭찬받는 폰트 위계 잡기"
          aria-invalid={errors.title ? "true" : undefined}
        />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title}</p>
        )}
      </div>

      {/* 설명 */}
      <div className="space-y-2">
        <Label htmlFor="description">
          설명 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="예: 왜 내가 만든 디자인은 가독성이 떨어질까? 그 해답은 폰트의 크기가 아니라 '위계'에 있습니다."
          rows={3}
          aria-invalid={errors.description ? "true" : undefined}
        />
        {errors.description && (
          <p className="text-destructive text-sm">{errors.description}</p>
        )}
      </div>

      {/* 태그 */}
      <div className="space-y-2">
        <Label htmlFor="tags">
          태그{" "}
          <span className="text-text-3 text-xs font-normal">(쉼표로 구분)</span>
        </Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => updateField("tags", e.target.value)}
          placeholder="예: design, uxui"
        />
        <p className="text-text-3 text-xs">
          태그를 쉼표로 구분하여 입력하세요. (예: design, uxui, frontend)
        </p>
      </div>

      {/* MDX 콘텐츠 */}
      <div className="space-y-2">
        <Label htmlFor="content">
          콘텐츠 (MDX) <span className="text-destructive">*</span>
        </Label>
        <MDXEditor
          value={formData.content}
          onChange={(value) => updateField("content", value)}
          placeholder="MDX 코드를 입력하세요..."
          error={errors.content}
        />
        {errors.content && (
          <p className="text-destructive text-sm">{errors.content}</p>
        )}
      </div>

      {/* 공개 여부 */}
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
        <p className="text-text-3 text-xs">
          체크 시 공개, 해제 시 비공개로 설정됩니다.
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "처리 중..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

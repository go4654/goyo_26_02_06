import type { PendingImage } from "./mdx-editor";

import { Image, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

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

import { MDX_EX_TEXT } from "../constants/mdx-ex-text";
import MDXEditor from "./mdx-editor";

/**
 * 대분류 카테고리 타입
 */
export type MainCategory = "design" | "publishing" | "development";

/**
 * 소분류 카테고리 타입
 */
export type SubCategory =
  | "figma"
  | "uxui"
  | "photoshop"
  | "illustrator"
  | "html"
  | "css"
  | "jquery"
  | "javascript"
  | "react"
  | "git"
  | "typescript";

/**
 * 대분류별 소분류 매핑
 */
export const CATEGORY_SUBCATEGORIES: Record<MainCategory, SubCategory[]> = {
  design: ["figma", "uxui", "photoshop", "illustrator"],
  publishing: ["html", "css", "jquery", "javascript"],
  development: ["react", "git", "typescript"],
};

/**
 * 소분류 표시 이름 매핑
 */
export const SUBCATEGORY_LABELS: Record<SubCategory, string> = {
  figma: "Figma",
  uxui: "UX UI",
  photoshop: "Photoshop",
  illustrator: "Illustrator",
  html: "HTML",
  css: "CSS",
  jquery: "jQuery",
  javascript: "JavaScript",
  react: "React",
  git: "Git",
  typescript: "TypeScript",
};

/**
 * 소분류에서 대분류 찾기
 */
export function getMainCategoryFromSub(
  subCategory: SubCategory,
): MainCategory | null {
  for (const [main, subs] of Object.entries(CATEGORY_SUBCATEGORIES)) {
    if (subs.includes(subCategory)) {
      return main as MainCategory;
    }
  }
  return null;
}

/**
 * 콘텐츠 폼 데이터 타입
 */
export interface ContentFormData {
  title: string;
  description: string;
  category: SubCategory; // 소분류 카테고리 (실제 DB에 저장되는 값)
  tags: string; // 쉼표로 구분된 태그 문자열 (예: "design, uxui")
  content: string; // MDX 코드
  isVisible: boolean; // 공개 여부
  thumbnailImageUrl?: string; // 썸네일 이미지 URL (초기값용, 선택적)
  /** 뉴스 전용: public | member (맴버만 공개 체크 시 member) */
  visibility?: "public" | "member";
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
  onSubmit: (
    data: ContentFormData,
    thumbnailFile: File | null,
  ) => void | Promise<void>;
  /** 취소 버튼 클릭 콜백 */
  onCancel?: () => void;
  /** 제출 버튼 텍스트 */
  submitLabel?: string;
  /** 취소 버튼 텍스트 */
  cancelLabel?: string;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 클래스 ID (MDX 이미지 업로드용, 선택적) */
  classId?: string | null;
  /** 임시 이미지 파일들 변경 콜백 (클래스 생성 전 이미지용) */
  onPendingImagesChange?: (
    updater: (prev: PendingImage[]) => PendingImage[],
  ) => void;
  /** 폼 변형: 'news' 시 카테고리(대분류/소분류)·태그 섹션 숨김 (뉴스는 별도 카테고리 Select 사용) */
  variant?: "class" | "news";
}

/**
 * 임시 이미지 정보 타입 재export
 */
export type { PendingImage } from "./mdx-editor";

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
  classId = null,
  onPendingImagesChange,
  variant = "class",
}: AdminContentFormProps) {
  // 초기 카테고리 설정
  const initialCategory = initialData.category || "figma";
  const initialMainCategory =
    getMainCategoryFromSub(initialCategory as SubCategory) || "design";

  const [mainCategory, setMainCategory] =
    useState<MainCategory>(initialMainCategory);
  const [formData, setFormData] = useState<ContentFormData>({
    title: initialData.title || "",
    description: initialData.description || "",
    category: (initialCategory as SubCategory) || "figma", // 기본값: figma
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
  // 뉴스 전용: 맴버만 공개 (기본값 false = public)
  const [memberOnly, setMemberOnly] = useState(
    initialData.visibility === "member",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    const newErrors: Partial<Record<keyof ContentFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "타이틀을 입력해주세요.";
    }

    if (variant !== "news" && !formData.description.trim()) {
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
    const submitData: ContentFormData =
      variant === "news"
        ? { ...formData, visibility: memberOnly ? "member" : "public" }
        : formData;
    await onSubmit(submitData, thumbnailFile);
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
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      {/* 카테고리 선택 (클래스/갤러리용 대분류·소분류, 뉴스는 미노출) */}
      {variant !== "news" && (
        <div className="space-y-2">
          <Label>
            카테고리 <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="mainCategory" className="text-text-3 text-xs">
                대분류
              </Label>
              <Select
                value={mainCategory}
                onValueChange={(value: MainCategory) => {
                  setMainCategory(value);
                  const availableSubs = CATEGORY_SUBCATEGORIES[value];
                  const currentSub = formData.category;
                  if (!availableSubs.includes(currentSub)) {
                    const firstSub = availableSubs[0];
                    updateField("category", firstSub);
                  }
                }}
              >
                <SelectTrigger id="mainCategory" className="w-full">
                  <SelectValue placeholder="대분류를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="design">DESIGN</SelectItem>
                  <SelectItem value="publishing">PUBLISHING</SelectItem>
                  <SelectItem value="development">DEVELOPMENT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="subCategory" className="text-text-3 text-xs">
                소분류
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: SubCategory) => {
                  updateField("category", value);
                  const newMainCategory = getMainCategoryFromSub(value);
                  if (newMainCategory && newMainCategory !== mainCategory) {
                    setMainCategory(newMainCategory);
                  }
                }}
              >
                <SelectTrigger id="subCategory" className="w-full">
                  <SelectValue placeholder="소분류를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_SUBCATEGORIES[mainCategory].map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {SUBCATEGORY_LABELS[sub]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-text-3 text-xs">
            대분류와 소분류를 선택하여 클래스를 분류하세요.
          </p>
        </div>
      )}

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

      {/* 설명 (뉴스는 미노출) */}
      {variant !== "news" && (
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
      )}

      {/* 태그 (뉴스는 미노출) */}
      {variant !== "news" && (
        <div className="space-y-2">
          <Label htmlFor="tags">
            태그{" "}
            <span className="text-text-3 text-xs font-normal">
              (쉼표로 구분)
            </span>
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
      )}

      {/* MDX 콘텐츠 */}
      <div className="space-y-2">
        <Label htmlFor="content">
          콘텐츠 (MDX) <span className="text-destructive">*</span>
        </Label>
        <MDXEditor
          value={formData.content}
          onChange={(value) => updateField("content", value)}
          placeholder={MDX_EX_TEXT}
          error={errors.content}
          classId={classId}
          onPendingImagesChange={onPendingImagesChange}
        />
        {errors.content && (
          <p className="text-destructive text-sm">{errors.content}</p>
        )}
      </div>

      {/* 맴버만 공개 (뉴스 전용, 공개 여부 위) */}
      {variant === "news" && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="memberOnly"
            checked={memberOnly}
            onCheckedChange={(checked) => setMemberOnly(checked === true)}
          />
          <Label
            htmlFor="memberOnly"
            className="cursor-pointer text-sm font-normal"
          >
            맴버만 공개
          </Label>
          <p className="text-text-3 text-xs">
            체크 시 로그인 회원만 볼 수 있습니다. (기본: 전체 공개)
          </p>
        </div>
      )}

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
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

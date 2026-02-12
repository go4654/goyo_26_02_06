import { useState } from "react";

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

  const [errors, setErrors] = useState<Partial<Record<keyof ContentFormData, string>>>({});

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          태그 <span className="text-text-3 text-xs font-normal">(쉼표로 구분)</span>
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
          className="text-sm font-normal cursor-pointer"
        >
          공개 여부
        </Label>
        <p className="text-text-3 text-xs">
          체크 시 공개, 해제 시 비공개로 설정됩니다.
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
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

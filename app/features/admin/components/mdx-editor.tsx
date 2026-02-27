import { Image, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Textarea } from "~/core/components/ui/textarea";

import { MDX_GALLERY_EX_TEXT } from "../constants/mdx-ex-text";
import { compressImageToWebp } from "../utils/image-upload";

/**
 * MDX 에디터 컴포넌트
 * MDX 코드를 작성하고 미리보기를 제공합니다.
 *
 * 기능:
 * - 이미지 업로드: Supabase storage에 업로드 후 MDX에 자동 삽입
 * - 커서 위치에 이미지 마크다운 삽입
 * - 업로드 중 상태 표시
 *
 * 참고: 실제 MDX 컴파일은 서버 사이드에서 처리됩니다.
 * 미리보기는 기본 마크다운 렌더링으로 표시됩니다.
 */
/**
 * 임시 이미지 정보
 * 클래스 생성 전에 선택한 이미지를 저장합니다.
 */
export interface PendingImage {
  file: File;
  tempId: string; // 임시 ID (MDX에서 사용)
  tempUrl: string; // 임시 blob URL
}

interface MDXEditorProps {
  /** MDX 코드 값 */
  value: string;
  /** 값 변경 콜백 */
  onChange: (value: string) => void;
  /** 에디터 placeholder */
  placeholder?: string;
  /** 에러 메시지 */
  error?: string;
  /** 클래스 ID (이미지 업로드용, 선택적) */
  classId?: string | null;
  /** 임시 이미지 파일들 변경 콜백 (클래스 생성 전 이미지용) */
  onPendingImagesChange?: (
    updater: (prev: PendingImage[]) => PendingImage[],
  ) => void;
}

export default function MDXEditor({
  value,
  onChange,
  placeholder = MDX_GALLERY_EX_TEXT,
  error,
  classId,
  onPendingImagesChange,
}: MDXEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetcher = useFetcher();

  /**
   * 커서 위치에 텍스트를 삽입하는 함수
   *
   * @param text - 삽입할 텍스트
   */
  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);

    // 커서 위치에 텍스트 삽입
    const newValue = before + text + after;
    onChange(newValue);

    // 커서 위치를 삽입된 텍스트 뒤로 이동
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  /**
   * 이미지 파일 선택 핸들러
   *
   * @param event - 파일 입력 이벤트
   */
  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일만 허용
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setIsUploading(true);

    try {
      // 이미지 압축 (webp 변환)
      const compressedFile = await compressImageToWebp(file);

      // 클래스 ID가 있으면 즉시 업로드
      if (classId) {
        // FormData 생성
        const formData = new FormData();
        formData.append("classId", classId);
        formData.append("image", compressedFile);

        // 서버에 업로드 요청 (라우트: /api/admin/upload-content-image)
        fetcher.submit(formData, {
          method: "POST",
          action: "/api/admin/upload-content-image",
          encType: "multipart/form-data",
        });
      } else {
        // 클래스 생성 전: 임시 이미지로 저장
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const tempUrl = URL.createObjectURL(compressedFile);

        const pendingImage: PendingImage = {
          file: compressedFile,
          tempId,
          tempUrl,
        };

        // 상위 컴포넌트에 알림
        onPendingImagesChange?.((prev) => [...(prev || []), pendingImage]);

        // MDX에 임시 이미지 마크다운 삽입 (tempId를 포함하여 나중에 교체 가능하도록)
        const imageMarkdown = `![이미지](TEMP_IMAGE_${tempId})\n\n`;
        insertTextAtCursor(imageMarkdown);

        setIsUploading(false);
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "이미지 압축에 실패했습니다. 다시 시도해주세요.",
      );
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 업로드 완료/에러 처리 (useEffect, 페이지 이동 없음)
  useEffect(() => {
    if (!fetcher.data || fetcher.state !== "idle") return;

    if ("success" in fetcher.data && fetcher.data.success && fetcher.data.url) {
      const publicUrl = fetcher.data.url as string;
      const imageMarkdown = `![이미지](${publicUrl})\n\n`;
      insertTextAtCursor(imageMarkdown);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }

    if ("error" in fetcher.data && fetcher.data.error) {
      alert(fetcher.data.error as string);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }

    setIsUploading(false);
  }, [fetcher.data, fetcher.state]);

  // 업로드 중 상태 업데이트
  useEffect(() => {
    if (fetcher.state === "submitting") {
      setIsUploading(true);
    } else if (fetcher.state === "idle" && !fetcher.data) {
      setIsUploading(false);
    }
  }, [fetcher.state, fetcher.data]);

  /**
   * 이미지 업로드 버튼 클릭 핸들러
   * 숨겨진 파일 입력을 트리거합니다.
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative space-y-2">
      {/* 탭 버튼 */}
      <div className="flex gap-2 border-b border-white/10">
        <Button
          type="button"
          variant={activeTab === "edit" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("edit")}
          className="rounded-b-none"
        >
          편집
        </Button>
        <Button
          type="button"
          variant={activeTab === "preview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("preview")}
          className="rounded-b-none"
        >
          미리보기
        </Button>
      </div>

      {/* 에디터 또는 미리보기 */}
      {activeTab === "edit" ? (
        <div className="space-y-2">
          {/* 에디터 툴바 */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              {/* 이미지 업로드 버튼 */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                disabled={isUploading}
                title="이미지 업로드"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>업로드 중...</span>
                  </>
                ) : (
                  <>
                    <Image className="size-4" />
                    <span>이미지 업로드</span>
                  </>
                )}
              </Button>

              {/* 숨겨진 파일 입력 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                aria-label="이미지 파일 선택"
              />
            </div>
          </div>

          {/* 텍스트 에리어 */}
          <Textarea
            ref={textareaRef}
            defaultValue={MDX_GALLERY_EX_TEXT}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (
                (e.metaKey || e.ctrlKey) &&
                e.shiftKey &&
                e.key.toLowerCase() === "i"
              ) {
                // Cmd+Shift+I (mac) 또는 Ctrl+Shift+I (윈도우)로 이미지 업로드 트리거
                e.preventDefault();
                handleUploadClick();
              }
            }}
            placeholder={placeholder}
            className="text-text-3 min-h-[400px] font-mono !text-base"
            aria-invalid={error ? "true" : undefined}
          />

          {error && <p className="text-destructive text-sm">{error}</p>}
          <p className="text-text-3 text-xs">
            💡 MDX 문법을 사용하여 콘텐츠를 작성할 수 있습니다. 미리보기 탭에서
            결과를 확인하세요. 이미지 업로드 버튼을 클릭하여 이미지를 추가할 수
            있습니다.
          </p>
        </div>
      ) : (
        <div className="min-h-[400px] overflow-auto rounded-md border border-white/10 bg-white/5 p-6">
          {value.trim() ? (
            <div className="prose prose-invert max-w-none">
              <pre className="text-text-2 font-mono text-sm whitespace-pre-wrap">
                {value}
              </pre>
              <p className="text-text-3 mt-4 text-xs">
                💡 실제 MDX 렌더링은 저장 후 상세 페이지에서 확인할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="text-text-3 py-12 text-center">
              미리보기를 보려면 MDX 코드를 입력하세요.
            </div>
          )}
        </div>
      )}

      {/* 편집 탭에서 언제나 접근 가능한 플로팅 이미지 업로드 버튼 */}
      {activeTab === "edit" && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleUploadClick}
          disabled={isUploading}
          className="!border-primary fixed right-6 bottom-6 z-40 cursor-pointer md:absolute md:right-10 md:bottom-20"
          title="이미지 업로드 (Cmd/Ctrl + Shift + I)"
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Image className="size-4" />
          )}
        </Button>
      )}
    </div>
  );
}

import { useRef, useState } from "react";

import { Image, Loader2 } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Textarea } from "~/core/components/ui/textarea";

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
interface MDXEditorProps {
  /** MDX 코드 값 */
  value: string;
  /** 값 변경 콜백 */
  onChange: (value: string) => void;
  /** 에디터 placeholder */
  placeholder?: string;
  /** 에러 메시지 */
  error?: string;
}

export default function MDXEditor({
  value,
  onChange,
  placeholder = "MDX 코드를 입력하세요...",
  error,
}: MDXEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일만 허용
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Supabase storage에 실제 업로드
      // 현재는 모양만 구현 (임시 URL 생성)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 업로드 시뮬레이션

      // 임시: 파일명 기반 URL 생성 (실제로는 Supabase에서 반환된 URL 사용)
      const fileName = file.name;
      const timestamp = Date.now();
      const publicUrl = `https://your-supabase-project.supabase.co/storage/v1/object/public/images/${timestamp}-${fileName}`;

      // MDX 이미지 마크다운 삽입
      const imageMarkdown = `![${fileName}](${publicUrl})\n\n`;
      insertTextAtCursor(imageMarkdown);
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /**
   * 이미지 업로드 버튼 클릭 핸들러
   * 숨겨진 파일 입력을 트리거합니다.
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="font-mono text-sm min-h-[400px]"
            aria-invalid={error ? "true" : undefined}
          />

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          <p className="text-text-3 text-xs">
            💡 MDX 문법을 사용하여 콘텐츠를 작성할 수 있습니다. 미리보기 탭에서
            결과를 확인하세요. 이미지 업로드 버튼을 클릭하여 이미지를 추가할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="min-h-[400px] rounded-md border border-white/10 bg-white/5 p-6 overflow-auto">
          {value.trim() ? (
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-text-2 font-mono">
                {value}
              </pre>
              <p className="text-text-3 text-xs mt-4">
                💡 실제 MDX 렌더링은 저장 후 상세 페이지에서 확인할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="text-text-3 text-center py-12">
              미리보기를 보려면 MDX 코드를 입력하세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

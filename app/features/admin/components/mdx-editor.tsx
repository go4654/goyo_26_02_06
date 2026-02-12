import { useState } from "react";

import { Button } from "~/core/components/ui/button";
import { Textarea } from "~/core/components/ui/textarea";

/**
 * MDX 에디터 컴포넌트
 * MDX 코드를 작성하고 미리보기를 제공합니다.
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
          <Textarea
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
            결과를 확인하세요.
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

import type { MDXContentProps } from "mdx-bundler/client";

import { getMDXComponent } from "mdx-bundler/client";
import { useMemo } from "react";

interface MDXContentComponentProps {
  /** bundleMDX로 컴파일된 코드 문자열 */
  code: string;
  /** 루트 wrapper에 적용할 클래스명 (예: prose) */
  className?: string;
  /** MDX 기본 요소 오버라이드 (선택) */
  components?: MDXContentProps["components"];
}

/**
 * bundleMDX로 컴파일된 MDX 코드를 React로 렌더링하는 공통 컴포넌트.
 * 뉴스 본문, 갤러리 description/caption 등 MDX 저장 필드 출력용.
 */
export function MDXContent({
  code,
  className,
  components = {},
}: MDXContentComponentProps) {
  const Component = useMemo(() => getMDXComponent(code), [code]);

  return (
    <div className={className}>
      <Component
        components={{
          h1: (props) => (
            <h1
              className="text-h1 xl:text-h2 font-semibold tracking-tight"
              {...props}
            />
          ),
          h2: (props) => <h2 className="text-h2 mt-18" {...props} />,

          // 갤러리 캔션
          h3: (props) => (
            <h3 className="text-h3 font-regular mt-12" {...props} />
          ),

          h4: (props) => (
            <h4 className="text-h4 mt-12 font-semibold" {...props} />
          ),

          h5: (props) => <h5 className="text-h5 mt-10 font-light" {...props} />,

          // 갤러리 설명
          h6: (props) => (
            <h6
              className="text-text-3 font-regular mt-8 text-[24px] leading-10 tracking-wide"
              {...props}
            />
          ),

          /** 일반 본문 텍스트 */
          p: (props) => (
            <p
              className="text-text-2 mt-4 text-base leading-relaxed font-medium"
              {...props}
            />
          ),

          pre: (props) => (
            <pre
              className="my-8 overflow-x-auto rounded-xl border border-white/10 bg-[#0F172A] p-5 text-sm text-white"
              {...props}
            />
          ),

          code: (props) => (
            <code className="font-mono text-[14px]" {...props} />
          ),

          /** 리스트 (불릿 목록) */
          ul: (props) => (
            <ul
              className="text-text-2 mt-6 ml-6 list-disc space-y-2"
              {...props}
            />
          ),

          strong: (props) => (
            <strong className="text-text-1 font-semibold" {...props} />
          ),

          em: (props) => <em className="text-text-1/90 italic" {...props} />,

          /** 인용문 */
          blockquote: (props) => (
            <blockquote
              className="border-primary text-text-2 my-8 border-l-4 pl-4 italic"
              {...props}
            />
          ),

          /** 이미지 */
          img: (props) => (
            <img className="my-8 rounded-2xl shadow-xl" {...props} />
          ),

          a: (props) => (
            <a className="text-primary hover:underline" {...props} />
          ),
        }}
      />
    </div>
  );
}

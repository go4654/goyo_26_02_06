import type { MDXContentProps } from "mdx-bundler/client";

import { getMDXComponent } from "mdx-bundler/client";
import { useMemo } from "react";

import { cn } from "../lib/utils";

// import { MDXGalleryGrid } from "~/features/gallery/components/mdx-gallery-text";

interface MDXNewsContentComponentProps {
  /** bundleMDX로 컴파일된 코드 문자열 */
  code: string;
  /** 루트 wrapper에 적용할 클래스명 (예: prose) */
  className?: string;
  /** MDX 기본 요소 오버라이드 (선택) */
  components?: MDXContentProps["components"];
}

/**
 * bundleMDX로 컴파일된 MDX 코드를 React로 렌더링하는 공통 컴포넌트.
 * 갤러리, 뉴스 본문,  description/caption 등 MDX 저장 필드 출력용.
 */
export function MDXNewsContent({
  code,
  className,
  components = {},
}: MDXNewsContentComponentProps) {
  const Component = useMemo(() => getMDXComponent(code), [code]);

  return (
    <div className={className}>
      <Component
        components={{
          /* ===== Headings ===== */

          h1: (props) => (
            <h1
              className="mt-10 text-3xl font-semibold tracking-tight xl:text-4xl"
              {...props}
            />
          ),

          h2: (props) => (
            <h2
              className="mt-14 text-2xl font-semibold tracking-tight xl:text-3xl"
              {...props}
            />
          ),

          h3: (props) => (
            <h3
              className="mt-12 text-xl font-semibold xl:text-2xl"
              {...props}
            />
          ),

          h4: (props) => (
            <h4 className="mt-10 text-lg font-medium xl:text-xl" {...props} />
          ),

          /* ===== Body ===== */

          p: (props) => (
            <p
              className="text-text-2 mt-6 text-base leading-relaxed xl:text-[17px]"
              {...props}
            />
          ),

          strong: (props) => (
            <strong className="text-text-1 font-semibold" {...props} />
          ),

          em: (props) => <em className="text-text-1/80 italic" {...props} />,

          hr: (props) => (
            <hr
              className="my-16 border-t border-black/10 dark:border-white/10"
              {...props}
            />
          ),

          /* ===== Lists ===== */

          ul: (props) => (
            <ul
              className="text-text-2 mt-6 ml-6 list-disc space-y-2"
              {...props}
            />
          ),

          ol: (props) => (
            <ol
              className="text-text-2 mt-6 ml-6 list-decimal space-y-2"
              {...props}
            />
          ),

          /* ===== Blockquote ===== */

          blockquote: (props) => (
            <blockquote
              className="border-primary/50 text-text-2 my-10 rounded-lg border-l-4 bg-white/5 px-6 py-4 italic"
              {...props}
            />
          ),

          /* ===== Code ===== */

          pre: (props) => (
            <pre
              className="my-10 overflow-x-auto rounded-xl border border-white/10 bg-[#0F172A] p-6 text-sm text-white"
              {...props}
            />
          ),

          code: (props) => (
            <code
              className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm"
              {...props}
            />
          ),

          /* ===== Image ===== */

          img: (props) => (
            <img
              className="my-10 w-full rounded-xl border border-white/5"
              {...props}
            />
          ),

          /* ===== Link ===== */

          a: (props) => (
            <a
              className="text-primary underline-offset-4 hover:underline"
              {...props}
            />
          ),
        }}
      />
    </div>
  );
}

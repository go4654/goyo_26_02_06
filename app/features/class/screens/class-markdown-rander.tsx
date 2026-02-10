import { getMDXComponent } from "mdx-bundler/client";
import { useMemo } from "react";

import { ThreeColumns } from "../components/mdx/three-columns";

/**
 * MDXRenderer
 *
 * 역할:
 * - DB 또는 loader에서 받아온 MDX 코드 문자열을
 *   실제 React 컴포넌트로 변환해서 화면에 렌더링하는 컴포넌트
 *
 * 주의:
 * - 이 컴포넌트는 "본문 전용"
 * - 상단 타이틀 / 메타 정보 / 썸네일 영역과는 완전히 분리됨
 */
export default function MDXRenderer({ code }: { code: string }) {
  /**
   * getMDXComponent는 문자열 형태의 MDX 코드를
   * 실행 가능한 React 컴포넌트로 변환해주는 함수
   *
   * useMemo를 쓰는 이유:
   * - code가 바뀌지 않는 한 매 렌더마다 새로 컴파일하지 않도록 하기 위해
   * - 성능 최적화 목적
   */
  const Component = useMemo(() => getMDXComponent(code), [code]);

  return (
    /**
     * 전체 MDX 콘텐츠 래퍼
     * - 섹션 간 간격을 크게 주기 위해 space-y 사용
     * - 상단 hero 영역과 시각적으로 분리하기 위해 mt-24 적용
     */
    <div className="mt-24 space-y-8">
      <Component
        /**
         * MDX 안에 등장하는 기본 HTML 태그들을
         * GOYO 디자인 시스템에 맞는 스타일로 덮어씌우는 부분
         *
         * 여기서 타이포그래피, 여백, 컬러 톤을 전부 통제함
         */
        components={{
          ThreeColumns,

          /** 대제목 (##) */
          h1: (props) => (
            <h1
              className="text-h3 xl:text-h2 font-bold tracking-tight"
              {...props}
            />
          ),

          /** 섹션 제목 (###) */
          h2: (props) => <h2 className="text-h4 xl:text-h3 mt-18" {...props} />,

          /** 타이틀 문단 */
          h3: (props) => (
            <h3
              className="text-h5 text-text-2 mt-12 font-semibold"
              {...props}
            />
          ),

          h4: (props) => (
            <h4 className="text-h6 text-text-3 mt-12" {...props} />
          ),

          /** 일반 본문 텍스트 */
          p: (props) => (
            <p
              className="text-small-title text-text-2 mt-4 leading-relaxed font-medium"
              {...props}
            />
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
        }}
      />
    </div>
  );
}

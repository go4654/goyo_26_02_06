/**
 * 블로그 글 상세 화면 컴포넌트
 *
 * MDX로 개별 블로그 글을 렌더링합니다. 구현 내용:
 * - 커스텀 컴포넌트를 사용한 MDX 번들링 및 렌더링
 * - 메타데이터용 frontmatter 추출
 * - React Router 동적 라우팅
 * - meta 태그를 통한 SEO
 * - 없거나 잘못된 글에 대한 에러 처리
 */
import type { Route } from "./+types/post";

import { bundleMDX } from "mdx-bundler";
import { getMDXComponent } from "mdx-bundler/client";
import path from "node:path";
import { data } from "react-router";

import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyList,
  TypographyOrderedList,
  TypographyP,
} from "~/core/components/mdx-typography";
import { Badge } from "~/core/components/ui/badge";

/**
 * 블로그 글 페이지 메타 함수
 *
 * SEO 및 소셜 공유를 위한 meta 태그를 생성합니다.
 * - 글을 찾은 경우: title, description, Open Graph 태그 설정
 * - 글을 찾지 못한 경우: 404 제목 설정
 *
 * Open Graph 태그로 Twitter, Facebook, LinkedIn 등에서 풍부한 미리보기가 가능합니다.
 *
 * @param data - 로더에서 반환된 데이터
 * @returns 페이지용 meta 태그 객체 배열
 */
export const meta: Route.MetaFunction = ({ data }) => {
  // 글을 찾지 못한 경우
  if (!data) {
    return [
      {
        title: `404 페이지를 찾을 수 없습니다. | ${import.meta.env.VITE_APP_NAME}`,
      },
    ];
  }

  // 찾은 글에 대한 meta 태그 생성
  return [
    // 글 제목과 앱 이름을 포함한 페이지 제목
    {
      title: `${data.frontmatter.title} | ${import.meta.env.VITE_APP_NAME}`,
    },
    // 검색엔진용 meta description
    {
      name: "description",
      content: data.frontmatter.description,
    },
    // 소셜 미디어 미리보기용 Open Graph 이미지
    {
      name: "og:image",
      content: `http://localhost:5173/api/blog/og?slug=${data.frontmatter.slug}`,
    },
    // 소셜 미디어 미리보기용 Open Graph 제목
    {
      name: "og:title",
      content: data.frontmatter.title,
    },
    // 소셜 미디어 미리보기용 Open Graph 설명
    {
      name: "og:description",
      content: data.frontmatter.description,
    },
  ];
};

/**
 * 블로그 글 콘텐츠 조회·처리용 서버 로더
 *
 * 역할:
 * 1. URL slug로 MDX 파일 경로 결정
 * 2. MDX 콘텐츠 번들링 및 처리
 * 3. frontmatter 메타데이터 추출
 * 4. 없거나 잘못된 글에 대한 에러 처리
 *
 * MDX 번들러는 마크다운을 실행 가능한 React 컴포넌트로 컴파일하면서
 * frontmatter(제목, 날짜, 작성자 등)를 추출합니다.
 *
 * @param params - 글 slug를 포함한 라우트 파라미터
 * @returns 처리된 MDX code와 frontmatter 메타데이터
 * @throws 글 없음 시 404, 기타 오류 시 500
 */
export async function loader({ params }: Route.LoaderArgs) {
  // slug 파라미터로 MDX 파일 전체 경로 구성
  const filePath = path.join(
    process.cwd(),
    "app",
    "features",
    "blog",
    "docs",
    `${params.slug}.mdx`,
  );

  try {
    // MDX 파일 처리하여 code와 frontmatter 추출
    const { code, frontmatter } = await bundleMDX({
      file: filePath,
    });

    // 컴파일된 MDX code와 frontmatter 메타데이터 반환
    return {
      frontmatter,
      code,
    };
  } catch (error) {
    // 파일 없음 시 404 반환
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw data(null, { status: 404 });
    }
    // 기타 오류 시 500 반환
    throw data(null, { status: 500 });
  }
}

/**
 * 블로그 글 컴포넌트
 *
 * 다음을 포함해 블로그 글 전체를 렌더링합니다:
 * - 제목, 카테고리, 작성자, 날짜가 있는 헤더
 * - 대표 이미지
 * - 커스텀 타이포그래피 컴포넌트로 스타일된 MDX 본문
 *
 * MDX 본문은 모든 글에서 일관된 스타일을 위해 커스텀 컴포넌트로 렌더링하며,
 * 마크다운으로 작성하면서도 디자인 시스템의 타이포그래피를 유지합니다.
 *
 * @param loaderData - frontmatter와 컴파일된 MDX code를 담은 로더 데이터
 */
export default function Post({
  loaderData: { frontmatter, code },
}: Route.ComponentProps) {
  // 컴파일된 MDX code를 React 컴포넌트로 변환
  const MDXContent = getMDXComponent(code);

  return (
    <div className="mx-auto w-full space-y-10">
      {/* 글 헤더 (카테고리, 제목, 작성자, 날짜) */}
      <header className="space-y-4">
        <div className="space-y-2">
          <Badge variant="secondary">{frontmatter.category}</Badge>
          <h1 className="text-3xl font-bold md:text-5xl lg:text-7xl">
            {frontmatter.title}
          </h1>
        </div>
        <span className="text-muted-foreground">
          {frontmatter.author} on{" "}
          {new Date(frontmatter.date).toLocaleDateString("ko-KR")}
        </span>
      </header>

      {/* 글 대표 이미지 */}
      <img
        src={`/blog/${frontmatter.slug}.jpg`}
        alt={frontmatter.title}
        className="aspect-square w-full rounded-xl object-cover object-center"
      />

      {/* 커스텀 타이포그래피 컴포넌트로 MDX 본문 렌더링 */}
      <MDXContent
        components={{
          // HTML 요소를 커스텀 스타일 컴포넌트에 매핑
          h1: TypographyH1,
          h2: TypographyH2,
          h3: TypographyH3,
          h4: TypographyH4,
          p: TypographyP,
          blockquote: TypographyBlockquote,
          ul: TypographyList,
          ol: TypographyOrderedList,
          code: TypographyInlineCode,
        }}
      />
    </div>
  );
}

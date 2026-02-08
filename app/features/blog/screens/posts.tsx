/**
 * 블로그 글 목록 화면
 *
 * docs 디렉터리의 MDX 파일에서 블로그 글 목록을 가져와 표시합니다.
 * mdx-bundler로 frontmatter를 추출하고, 이미지·제목·설명·메타데이터가 있는
 * 블로그 카드 그리드를 렌더링합니다.
 *
 * 구현 내용:
 * 1. frontmatter 추출을 통한 MDX 콘텐츠 처리
 * 2. 블로그 콘텐츠 읽기를 위한 파일 시스템 연산
 * 3. 화면 크기별 반응형 그리드 레이아웃
 * 4. 페이지 간 부드러운 전환을 위한 View transitions
 */
import type { Route } from "./+types/posts";

import { bundleMDX } from "mdx-bundler";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";

/**
 * 블로그 목록 페이지 메타 함수
 *
 * 환경 변수의 앱 이름으로 페이지 제목을 설정하고,
 * SEO를 위한 meta description을 추가합니다.
 */
export const meta: Route.MetaFunction = () => {
  return [
    { title: `Supablog | ${import.meta.env.VITE_APP_NAME}` },
    { name: "description", content: "Follow our development journey!" },
  ];
};

/**
 * MDX frontmatter 구조 정의
 *
 * 각 MDX 블로그 글 파일의 frontmatter에 다음 메타데이터 필드가 필요합니다:
 * - title: 블로그 글 제목
 * - description: 글 내용 요약
 * - date: 발행일 (정렬에 사용)
 * - category: 필터/그룹용 카테고리
 * - author: 작성자 이름
 * - slug: URL용 식별자
 */
interface Frontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  slug: string;
}

/**
 * 블로그 목록 페이지 로더
 *
 * docs 디렉터리의 모든 MDX 파일을 읽어 frontmatter를 추출합니다:
 * 1. MDX 블로그 글이 있는 docs 디렉터리 경로 결정
 * 2. 디렉터리 내 모든 파일 읽기 후 .mdx만 필터링
 * 3. 각 MDX 파일 처리하여 frontmatter 메타데이터 추출
 * 4. 날짜 기준 정렬 (최신순)
 * 5. 컴포넌트에서 사용할 frontmatter 데이터 반환
 *
 * @returns 블로그 글 frontmatter 배열을 담은 객체
 */
export async function loader() {
  // MDX 파일이 있는 docs 디렉터리 경로
  const docsPath = path.join(process.cwd(), "app", "features", "blog", "docs");

  // docs 디렉터리 내 모든 파일 읽기
  const files = await readdir(docsPath);

  // .mdx 파일만 필터링
  const mdxFiles = files.filter((file) => file.endsWith(".mdx"));

  // 각 MDX 파일에서 frontmatter 추출
  const frontmatters = await Promise.all(
    mdxFiles.map(async (file) => {
      const filePath = path.join(docsPath, file);
      const { frontmatter } = await bundleMDX({ file: filePath });
      return frontmatter;
    }),
  );

  // 날짜 기준 최신순 정렬
  frontmatters.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // frontmatter 데이터 반환
  return {
    frontmatters: frontmatters as Frontmatter[],
  };
}

/**
 * 블로그 글 목록 컴포넌트
 *
 * 헤더와 블로그 카드 그리드로 목록 페이지를 렌더링합니다.
 * 각 카드에는 다음이 표시됩니다:
 * - 대표 이미지 (글 slug와 매칭)
 * - 카테고리 뱃지
 * - 글 제목·설명
 * - 작성자 및 날짜
 *
 * 반응형: 모바일은 1열, 데스크톱은 3열 그리드입니다.
 * 목록과 개별 글 페이지 간 부드러운 전환을 위해 view transitions를 사용합니다.
 *
 * @param loaderData - 로더에서 전달된 블로그 글 frontmatter
 */
export default function Posts({
  loaderData: { frontmatters },
}: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-16">
      {/* 페이지 헤더 (제목·부제목) */}
      <header className="flex flex-col items-center">
        <h1 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
          Blog
        </h1>
        <p className="text-muted-foreground mt-2 text-center font-medium md:text-lg">
          Follow our development journey!
        </p>
      </header>

      {/* 블로그 카드 반응형 그리드 */}
      <div className="grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-8">
        {frontmatters.map((frontmatter) => (
          <Link
            to={`/blog/${frontmatter.slug}`}
            key={frontmatter.slug}
            className="flex flex-col gap-4"
            viewTransition // 페이지 간 부드러운 전환
          >
            {/* 글 대표 이미지 */}
            <img
              src={`/blog/${frontmatter.slug}.jpg`}
              alt={frontmatter.title}
              className="aspect-square w-full rounded-xl object-cover object-center"
            />
            {/* 카테고리 뱃지 */}
            <Badge variant="secondary" className="text-sm">
              {frontmatter.category}
            </Badge>
            <div>
              {/* 글 제목 */}
              <h2 className="text-lg font-bold md:text-2xl">
                {frontmatter.title}
              </h2>
              {/* 글 설명 */}
              <p className="text-muted-foreground text-pretty md:text-lg">
                {frontmatter.description}
              </p>
              {/* 작성자 및 날짜 */}
              <span className="text-muted-foreground mt-2 block text-sm">
                By {frontmatter.author} on{" "}
                {new Date(frontmatter.date).toLocaleDateString("ko-KR")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Open Graph 이미지 생성 API
 *
 * 이 모듈은 블로그 글의 frontmatter 메타데이터를 기반으로 Open Graph(OG) 이미지를
 * 동적으로 생성합니다. 생성된 이미지는 블로그 글이 소셜 미디어에 공유될 때
 * 풍부한 미리보기를 제공하는 데 사용됩니다.
 *
 * 생성 과정:
 * - 요청 URL에서 블로그 글 슬러그 추출
 * - 해당 MDX 파일을 로드·파싱하여 frontmatter 메타데이터 획득
 * - 블로그 글 제목과 설명이 포함된 이미지 생성
 * - 블로그 글 대표 이미지를 배경으로 사용
 * - 소셜 공유에 적합한 크기로 생성된 이미지 반환
 *
 * Twitter, Facebook, LinkedIn 등에서 일관된 브랜드 미리보기 이미지를 제공하여
 * 블로그 콘텐츠의 소셜 공유 품질을 높입니다.
 */
import type { Route } from "./+types/og";

import { ImageResponse } from "@vercel/og";
import { bundleMDX } from "mdx-bundler";
import path from "node:path";
import { data } from "react-router";
import { z } from "zod";

/**
 * OG 이미지 요청 파라미터 검증 스키마
 *
 * 요청에 유효한 블로그 글 슬러그 파라미터가 포함되었는지 검증합니다.
 * 이미지 생성 전에 Zod의 safeParse로 URL 검색 파라미터를 검증할 때 사용합니다.
 */
const paramsSchema = z.object({
  slug: z.string(),
});

/**
 * Open Graph 이미지 생성 로더
 *
 * 블로그 글용 동적 OG 이미지 요청을 처리합니다. 처리 단계:
 * 1. 요청 URL에서 블로그 글 슬러그 추출 및 검증
 * 2. 해당 MDX 파일 경로 구성
 * 3. MDX 파일 로드·파싱 후 frontmatter 메타데이터 추출
 * 4. 제목, 설명, 대표 이미지로 OG 이미지 생성
 * 5. 소셜 미디어에 맞는 크기로 이미지 반환
 *
 * 에러 처리:
 * - 파라미터 오류 시 400 Bad Request
 * - MDX 파일 없음 시 404 Not Found
 * - 기타 오류 시 500 Internal Server Error
 *
 * @param request - 쿼리 파라미터가 포함된 HTTP 요청
 * @returns 생성된 OG 이미지를 담은 ImageResponse
 */
export async function loader({ request }: Route.LoaderArgs) {
  // URL 검색 파라미터 추출 및 파싱
  const url = new URL(request.url);
  const {
    success,
    data: params,
    error,
  } = paramsSchema.safeParse(Object.fromEntries(url.searchParams));
  
  // 파라미터가 유효하지 않으면 400 Bad Request 반환
  if (!success) {
    return data(null, { status: 400 });
  }
  
  // MDX 파일 경로 구성
  const filePath = path.join(
    process.cwd(),
    "app",
    "features",
    "blog",
    "docs",
    `${params.slug}.mdx`,
  );
  
  try {
    // frontmatter 추출을 위해 MDX 파일 로드 및 파싱
    const { frontmatter } = await bundleMDX({
      file: filePath,
    });
    
    // Vercel ImageResponse로 OG 이미지 생성 후 반환
    return new ImageResponse(
      (
        <div tw="relative flex h-full w-full " style={{ fontFamily: "Inter" }}>
          {/* 블로그 글 대표 이미지 배경 */}
          <img
            src={`${process.env.SITE_URL}/blog/${params.slug}.jpg`}
            tw="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* 제목·설명 오버레이 */}
          <div tw="absolute flex h-full w-full items-center justify-center p-8 flex-col bg-black bg-opacity-20">
            <h1 tw="text-white text-6xl font-extrabold ">
              {frontmatter.title}
            </h1>
            <p tw="text-white text-3xl -mt-2">{frontmatter.description}</p>
          </div>
        </div>
      ),
      {
        // 소셜 미디어 공유에 맞춘 크기
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    // 파일 없음 시 404 반환
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw data(null, { status: 404 });
    }
    // 기타 오류 시 500 반환
    throw data(null, { status: 500 });
  }
}

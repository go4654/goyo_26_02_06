import type { Route } from "../screens/+types/class-detail";

import { bundleMDX } from "mdx-bundler";
import rehypePrettyCode from "rehype-pretty-code";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  getClassBySlug,
  getClassNavigation,
  incrementClassView,
} from "../queries";

/**
 * 클래스 상세 페이지 로더
 *
 * 기능:
 * - 인증 확인
 * - slug 기반 클래스 상세 정보 조회
 * - MDX 콘텐츠 번들링
 * - 조회수 증가 (트리거에 의해 자동 처리)
 * - 이전/다음 클래스 정보 조회
 */
export async function classDetailLoader({
  request,
  params,
}: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const { slug } = params;

  if (!slug) {
    throw new Response("클래스를 찾을 수 없습니다.", { status: 404 });
  }

  // 클래스 상세 정보 조회
  const classDetail = await getClassBySlug(client, slug);

  // 현재 사용자 정보 조회 (조회수 기록용)
  const {
    data: { user },
  } = await client.auth.getUser();
  const userId = user?.id || null;

  // 조회수 증가 (트리거에 의해 자동으로 view_count 증가)
  // 에러가 발생해도 페이지는 표시되도록 try-catch 처리
  try {
    await incrementClassView(client, classDetail.id, userId);
  } catch (error) {
    // 조회수 증가 실패는 로그만 남기고 계속 진행
    console.error("조회수 증가 실패:", error);
  }

  // 이전/다음 클래스 조회
  const navigation = await getClassNavigation(
    client,
    slug,
    classDetail.category,
  );

  // MDX 콘텐츠 번들링
  const { code } = await bundleMDX({
    source: classDetail.content_mdx,
    mdxOptions(options) {
      options.remarkPlugins = [...(options.remarkPlugins ?? [])];
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        [rehypePrettyCode, { theme: "github-dark" }],
      ];
      return options;
    },
  });

  return {
    class: classDetail,
    code,
    navigation,
  };
}

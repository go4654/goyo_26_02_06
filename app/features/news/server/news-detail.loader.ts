import type { Route } from "../screens/+types/news-detail";

import { bundleMDX } from "mdx-bundler";
import { data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import { getNewsBySlug, incrementNewsView } from "../queries";

/**
 * 뉴스 상세 로더
 * - slug로 뉴스 조회, 없으면 404
 * - content_mdx를 bundleMDX로 컴파일하여 클라이언트에서 MDX 렌더
 * - 조회 이벤트 기록 (트리거로 view_count 증가)
 */
export async function newsDetailLoader({
  request,
  params,
}: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);

  const slug = params.slug;
  if (!slug) {
    throw new Response("뉴스를 찾을 수 없습니다.", { status: 404 });
  }

  const news = await getNewsBySlug(client, slug);
  if (!news) {
    throw new Response("뉴스를 찾을 수 없습니다.", { status: 404 });
  }

  const {
    data: { user },
  } = await client.auth.getUser();
  const userId = user?.id ?? null;

  incrementNewsView(client, news.id, userId).catch((err) => {
    if (
      typeof process !== "undefined" &&
      process.env?.NODE_ENV === "development"
    ) {
      console.error("뉴스 조회수 증가 실패:", err);
    }
  });

  const { code: contentCode } = await bundleMDX({
    source: news.content_mdx,
  });

  return data({ news, contentCode }, { headers });
}

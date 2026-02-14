import type { Route } from "../screens/+types/news";

import { data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import { getNewsList } from "../queries";

const DEFAULT_PAGE_SIZE = 10;

/**
 * 뉴스 목록 페이지 로더
 * - URL page 쿼리로 페이지네이션
 * - 세션 갱신용 headers 포함
 */
export async function newsLoader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);

  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  const result = await getNewsList(client, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  return data(
    {
      items: result.items,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        pageSize: result.pageSize,
      },
    },
    { headers },
  );
}

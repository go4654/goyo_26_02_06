import type { Route } from "../+types/news";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { deleteNewsBatch } from "../../../services/news-delete.service";

/**
 * 뉴스 일괄 삭제 액션 (Hard Delete)
 * DELETE 메서드만 허용, JSON body에 newsIds 배열 필요
 */
export async function newsDeleteAction({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  if (request.method !== "DELETE") {
    return data({ error: "잘못된 요청 메서드입니다." }, { status: 405 });
  }

  try {
    const body = await request.json();
    const newsIds = body.newsIds as string[] | undefined;

    if (!newsIds || !Array.isArray(newsIds) || newsIds.length === 0) {
      return data(
        { error: "삭제할 뉴스 ID가 필요합니다." },
        { status: 400 },
      );
    }

    const results = await deleteNewsBatch(client, newsIds);

    const deletedCount = results.filter((r) => r.success).length;
    const failed = results
      .filter((r) => !r.success)
      .map((r) => ({ newsId: r.newsId, error: r.error ?? "알 수 없는 오류" }));

    return data(
      {
        success: true,
        deletedCount,
        failed,
      },
      { status: 200 },
    );
  } catch (error) {
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "뉴스 삭제 중 알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

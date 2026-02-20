import type { Route } from "../+types/news";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getAdminNews, type AdminNewsRow } from "../queries";

/**
 * 뉴스 목록 로더
 *
 * 관리자 권한이 있는 사용자만 접근 가능합니다.
 * news 테이블에서 목록을 조회합니다. (ORDER BY created_at DESC)
 */
export async function newsLoader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  await requireAdmin(client);

  const rows = await getAdminNews(client);

  return { rows };
}

export type { AdminNewsRow };

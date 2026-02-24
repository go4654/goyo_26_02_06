import type { Route } from "../+types/admin-inquiries-detail";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * 관리자 문의 상세 로더
 *
 * 관리자 권한 확인만 수행합니다.
 * 상세 UI는 별도 구현 시 데이터 조회를 추가합니다.
 */
export async function adminInquiriesDetailLoader({
  request,
  params,
}: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  const id = params.id;
  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  return { id };
}

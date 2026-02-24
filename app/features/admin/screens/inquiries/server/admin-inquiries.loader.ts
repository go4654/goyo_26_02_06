import type { Route } from "../+types/admin-inquiries";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getAdminInquiries } from "../queries";

/**
 * 관리자 문의 목록 로더
 *
 * 관리자 권한이 있는 사용자만 접근 가능합니다.
 * 실제 DB( get_admin_inquiries_list RPC )에서 문의 목록을 조회합니다.
 */
export async function adminInquiriesLoader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  await requireAdmin(client);

  const rows = await getAdminInquiries(client);

  return { rows };
}

import type { Route } from "../layouts/+types/admin.layout";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * 관리자 레이아웃 로더
 * - requireAdmin으로 관리자 권한 확인
 * - pending 문의 개수 조회 (사이드바 뱃지용)
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  const user = await requireAdmin(client);

  const { count } = await client
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("is_deleted", false);

  return data(
    {
      user,
      pendingInquiryCount: count ?? 0,
    },
    { headers },
  );
}

import type { Route } from "../+types/admin-users";

import { data } from "react-router";
import type { Database } from "database.types";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

const ADMIN_USERS_SEEN_AT_COOKIE = "goyo_admin_users_seen_at";

/** get_admin_users_list RPC 반환 행 (last_active_at nullable) */
type AdminUsersListRow = Database["public"]["Functions"]["get_admin_users_list"]["Returns"][number] & {
  last_active_at: string | null;
};

/**
 * 유저 관리 테이블 행 데이터 타입
 */
export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  galleryAccess: boolean;
  isBlocked: boolean;
  createdAt: string;
  lastActiveAt: string | null;
};

/**
 * 유저 목록 로더
 * requireAdmin 후 auth.users + profiles JOIN 결과를 반환합니다.
 * 회원 목록 진입 시 쿠키에 확인 시각을 저장해, 이후 배지는 "이 시각 이후 가입"만 표시합니다.
 */
export async function usersLoader({ request }: Route.LoaderArgs) {
  const [client, existingHeaders] = makeServerClient(request);
  await requireAdmin(client);

  const { data: listData, error } = await client.rpc("get_admin_users_list");

  if (error) {
    throw new Response("유저 목록 조회에 실패했습니다.", { status: 500 });
  }

  const list = (listData ?? []) as AdminUsersListRow[];
  const rows: AdminUserRow[] = list.map((row) => ({
    id: row.id,
    email: row.email ?? "",
    name: row.name ?? "-",
    galleryAccess: row.gallery_access,
    isBlocked: row.is_blocked,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
  }));

  const seenAt = new Date().toISOString();
  const cookieValue = `${ADMIN_USERS_SEEN_AT_COOKIE}=${encodeURIComponent(seenAt)}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=2592000`;
  const headers = new Headers(existingHeaders);
  headers.append("Set-Cookie", cookieValue);

  return data({ rows }, { headers });
}

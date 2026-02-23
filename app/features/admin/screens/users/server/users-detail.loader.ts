import type { Route } from "../+types/admin-users-edit";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import adminClient from "~/core/lib/supa-admin-client.server";

/**
 * 유저 상세 정보 타입 (상세/수정 페이지용)
 */
export type AdminUserDetail = {
  id: string;
  email: string;
  nickname: string;
  galleryAccess: boolean;
  status: "active" | "suspended";
  adminMemo: string;
  createdAt: string;
  lastActiveAt: string;
};

/**
 * 유저 상세 로더
 * 경로 파라미터 :username(유저 id)으로 auth + profiles 조회 후 반환
 */
export async function userDetailLoader({
  request,
  params,
}: Route.LoaderArgs): Promise<{ user: AdminUserDetail }> {
  const userId = params.username;
  if (!userId) {
    throw new Response("유저를 찾을 수 없습니다.", { status: 404 });
  }

  const [client] = makeServerClient(request);
  await requireAdmin(client);

  const [authResult, profileResult] = await Promise.all([
    adminClient.auth.admin.getUserById(userId),
    client.from("profiles").select("profile_id, name, gallery_access, is_blocked, blocked_reason, last_active_at, created_at").eq("profile_id", userId).maybeSingle(),
  ]);

  const authUser = authResult.data?.user;
  const profile = profileResult.data;

  if (!authUser) {
    throw new Response("유저를 찾을 수 없습니다.", { status: 404 });
  }

  const name = profile?.name ?? "-";
  const galleryAccess = profile?.gallery_access ?? false;
  const isBlocked = profile?.is_blocked ?? false;
  const lastActiveAt = profile?.last_active_at ?? authUser.created_at ?? "";
  const createdAt = authUser.created_at ?? profile?.created_at ?? "";

  const user: AdminUserDetail = {
    id: userId,
    email: authUser.email ?? "",
    nickname: name,
    galleryAccess,
    status: isBlocked ? "suspended" : "active",
    adminMemo: profile?.blocked_reason ?? "",
    createdAt,
    lastActiveAt,
  };

  return { user };
}

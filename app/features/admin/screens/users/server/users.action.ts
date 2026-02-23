import type { Route } from "../+types/admin-users";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import adminClient from "~/core/lib/supa-admin-client.server";

type Client = ReturnType<typeof makeServerClient>[0];

/**
 * 선택 유저 하드 삭제: auth.users에서 삭제 (profiles는 FK CASCADE로 자동 삭제)
 */
async function deleteUsers(
  userIds: string[],
): Promise<{ success: boolean; error?: string }[]> {
  const results: { success: boolean; error?: string }[] = [];

  for (const id of userIds) {
    const { error } = await adminClient.auth.admin.deleteUser(id);
    results.push({ success: !error, error: error?.message });
  }

  return results;
}

/**
 * 선택 유저의 gallery_access 현재값 조회
 */
async function getProfilesFlags(
  client: Client,
  userIds: string[],
): Promise<{ profile_id: string; gallery_access: boolean; is_blocked: boolean }[]> {
  if (userIds.length === 0) return [];

  const { data: rows, error } = await client
    .from("profiles")
    .select("profile_id, gallery_access, is_blocked")
    .in("profile_id", userIds);

  if (error) return [];
  return (rows ?? []) as { profile_id: string; gallery_access: boolean; is_blocked: boolean }[];
}

/**
 * 포폴 접근 권한 토글: false → true, true → false
 */
async function toggleGalleryAccess(
  client: Client,
  userIds: string[],
): Promise<{ error: string | null }> {
  const rows = await getProfilesFlags(client, userIds);
  if (rows.length === 0) return { error: null };

  const toAllow = rows.filter((r) => !r.gallery_access).map((r) => r.profile_id);
  const toRevoke = rows.filter((r) => r.gallery_access).map((r) => r.profile_id);

  if (toAllow.length > 0) {
    const { error } = await client
      .from("profiles")
      .update({ gallery_access: true })
      .in("profile_id", toAllow);
    if (error) return { error: error.message };
  }
  if (toRevoke.length > 0) {
    const { error } = await client
      .from("profiles")
      .update({ gallery_access: false })
      .in("profile_id", toRevoke);
    if (error) return { error: error.message };
  }

  return { error: null };
}

/**
 * 유저 상태 토글: is_blocked true → false, false → true
 */
async function toggleUserStatus(
  client: Client,
  userIds: string[],
): Promise<{ error: string | null }> {
  const rows = await getProfilesFlags(client, userIds);
  if (rows.length === 0) return { error: null };

  const toUnblock = rows.filter((r) => r.is_blocked).map((r) => r.profile_id);
  const toBlock = rows.filter((r) => !r.is_blocked).map((r) => r.profile_id);

  if (toUnblock.length > 0) {
    const { error } = await client
      .from("profiles")
      .update({ is_blocked: false })
      .in("profile_id", toUnblock);
    if (error) return { error: error.message };
  }
  if (toBlock.length > 0) {
    const { error } = await client
      .from("profiles")
      .update({ is_blocked: true })
      .in("profile_id", toBlock);
    if (error) return { error: error.message };
  }

  return { error: null };
}

function parseUserIds(formData: FormData): string[] {
  const raw = formData.get("userIds");
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * 유저 액션
 * - DELETE: 선택 유저 하드 삭제 (auth.users 삭제, profiles는 CASCADE로 자동 삭제)
 * - POST: operation에 따라 toggle_gallery_access | toggle_user_status
 */
export async function usersAction({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  if (request.method === "DELETE") {
    let body: { userIds?: string[] };
    try {
      body = await request.json();
    } catch {
      return data({ error: "잘못된 요청 본문입니다." }, { status: 400 });
    }

    const userIds = body.userIds;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return data(
        { error: "삭제할 유저 ID가 필요합니다." },
        { status: 400 },
      );
    }

    const results = await deleteUsers(userIds);
    const deletedCount = results.filter((r) => r.success).length;
    const failed = results
      .map((r, i) =>
        !r.success ? { userId: userIds[i], error: r.error ?? "" } : null,
      )
      .filter((x): x is { userId: string; error: string } => x !== null);

    return data(
      { success: true, deletedCount, failed },
      { status: 200 },
    );
  }

  if (request.method === "POST") {
    const formData = await request.formData();
    const operation = formData.get("operation")?.toString();
    const userIds = parseUserIds(formData);

    if (userIds.length === 0) {
      return data({ error: "선택된 유저가 없습니다." }, { status: 400 });
    }

    if (operation === "toggle_gallery_access") {
      const { error } = await toggleGalleryAccess(client, userIds);
      if (error) return data({ error }, { status: 500 });
      return data({ success: true, operation: "toggle_gallery_access", count: userIds.length }, { status: 200 });
    }

    if (operation === "toggle_user_status") {
      const { error } = await toggleUserStatus(client, userIds);
      if (error) return data({ error }, { status: 500 });
      return data({ success: true, operation: "toggle_user_status", count: userIds.length }, { status: 200 });
    }

    return data({ error: "Invalid operation" }, { status: 400 });
  }

  return data({ error: "Method not allowed" }, { status: 405 });
}

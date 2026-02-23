/**
 * 유저 상세 수정 액션
 * gallery_access, is_blocked, admin_note 만 갱신 (나머지 필드 수정 금지)
 */
import type { Route } from "../+types/admin-users-edit";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

export type UserEditActionResponse =
  | { success: true }
  | { success: false; error: string };

function parseBoolean(value: FormDataEntryValue | null): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value === "true" || value === "1";
  return false;
}

export async function userEditAction({
  request,
  params,
}: Route.ActionArgs): Promise<ReturnType<typeof data<UserEditActionResponse>>> {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  const userId = params.username;
  if (!userId) {
    return data({ success: false, error: "유저를 찾을 수 없습니다." }, { status: 404 });
  }

  if (request.method !== "POST") {
    return data({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const galleryAccess = parseBoolean(formData.get("galleryAccess"));
  const isBlocked = parseBoolean(formData.get("is_blocked"));
  const adminNoteRaw = formData.get("adminNote");
  const adminNote =
    typeof adminNoteRaw === "string" ? adminNoteRaw.trim() || null : null;

  const { data: profile, error: selectError } = await client
    .from("profiles")
    .select("profile_id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (selectError) {
    return data(
      { success: false, error: "대상 유저를 조회할 수 없습니다." },
      { status: 500 },
    );
  }

  if (!profile) {
    return data({ success: false, error: "유저를 찾을 수 없습니다." }, { status: 404 });
  }

  const { error: updateError } = await client
    .from("profiles")
    .update({
      gallery_access: galleryAccess,
      is_blocked: isBlocked,
      admin_note: adminNote,
    })
    .eq("profile_id", userId);

  if (updateError) {
    return data(
      { success: false, error: updateError.message },
      { status: 500 },
    );
  }

  return data({ success: true }, { status: 200 });
}

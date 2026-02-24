/**
 * 관리자 설정 저장 액션
 * - requireAdmin 후 FormData 파싱 → Zod 검증 → updateSiteSettings
 * - redirect 사용 금지 (fetcher 연동용)
 */
import type { Route } from "../+types/admin-settings";

import { data } from "react-router";
import { z } from "zod";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { updateSiteSettings } from "../queries";

const noticeVariantSchema = z.enum(["info", "warning", "event"]);

const updateSettingsSchema = z.object({
  maintenanceMode: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  signupEnabled: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  noticeEnabled: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  noticeMessage: z
    .string()
    .optional()
    .transform((v) => (v === "" ? null : v ?? undefined)),
  noticeVariant: z
    .string()
    .optional()
    .refine((v) => noticeVariantSchema.safeParse(v).success, {
      message: "noticeVariant는 info, warning, event 중 하나여야 합니다.",
    })
    .transform((v) => (v ? noticeVariantSchema.parse(v) : undefined)),
  maintenanceMessage: z
    .string()
    .optional()
    .transform((v) => (v === "" ? null : v ?? undefined)),
});

export type AdminSettingsActionData =
  | { success: true }
  | { error: string; fieldErrors?: Record<string, string[]> };

export async function adminSettingsAction({
  request,
}: Route.ActionArgs): Promise<ReturnType<typeof data>> {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  if (request.method !== "POST") {
    return data({ error: "잘못된 요청 메서드입니다." }, { status: 405, headers });
  }

  const formData = await request.formData();
  const raw = {
    maintenanceMode: formData.get("maintenanceMode") ?? undefined,
    signupEnabled: formData.get("signupEnabled") ?? undefined,
    noticeEnabled: formData.get("noticeEnabled") ?? undefined,
    noticeMessage: formData.get("noticeMessage") ?? undefined,
    noticeVariant: formData.get("noticeVariant") ?? undefined,
    maintenanceMessage: formData.get("maintenanceMessage") ?? undefined,
  };

  const parsed = updateSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(parsed.error.flatten().fieldErrors)) {
      if (value && Array.isArray(value)) fieldErrors[key] = value;
    }
    return data(
      { error: "입력값이 올바르지 않습니다.", fieldErrors },
      { status: 400, headers },
    );
  }

  const patch = parsed.data;
  const updatePayload = {
    ...(patch.maintenanceMode !== undefined && { maintenanceMode: patch.maintenanceMode }),
    ...(patch.signupEnabled !== undefined && { signupEnabled: patch.signupEnabled }),
    ...(patch.noticeEnabled !== undefined && { noticeEnabled: patch.noticeEnabled }),
    ...(patch.noticeMessage !== undefined && { noticeMessage: patch.noticeMessage }),
    ...(patch.noticeVariant !== undefined && { noticeVariant: patch.noticeVariant }),
    ...(patch.maintenanceMessage !== undefined && {
      maintenanceMessage: patch.maintenanceMessage,
    }),
  };

  if (Object.keys(updatePayload).length === 0) {
    return data({ success: true }, { status: 200, headers });
  }

  try {
    await updateSiteSettings(client, updatePayload);
    return data({ success: true }, { status: 200, headers });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "설정 저장 중 알 수 없는 오류가 발생했습니다.";
    return data({ error: message }, { status: 500, headers });
  }
}

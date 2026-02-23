import type { Route } from "../screens/+types/inquiry-detail";

import { data } from "react-router";

import { getUserRole, requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

function getInquiryId(params: Route.ActionArgs["params"]): string {
  const inquiryId = params.id;
  if (!inquiryId) throw data(null, { status: 404 });
  return inquiryId;
}

export async function inquiryDetailAction({ request, params }: Route.ActionArgs) {
  if (request.method !== "POST") throw data(null, { status: 404 });

  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const { user, isAdmin } = await getUserRole(client);
  if (!user) throw data(null, { status: 401 });

  const inquiryId = getInquiryId(params);

  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent !== "sendMessage") throw data(null, { status: 404 });

  const contentRaw = formData.get("content");
  const content = typeof contentRaw === "string" ? contentRaw.trim() : "";
  if (!content) throw data(null, { status: 404 });

  const { data: inquiry, error: inquiryError } = await client
    .from("inquiries")
    .select("id, profile_id, status")
    .eq("id", inquiryId)
    .single();

  if (inquiryError || !inquiry) throw data(null, { status: 404 });

  // 일반 유저는 본인 문의만 (관리자는 전체)
  if (!isAdmin && inquiry.profile_id !== user.id) throw data(null, { status: 403 });

  // 닫힌 문의는 메시지 전송 불가
  if (inquiry.status === "closed") throw data(null, { status: 403 });

  const authorRole = isAdmin ? ("admin" as const) : ("user" as const);

  const { error: insertError } = await client.from("inquiry_messages").insert({
    inquiry_id: inquiryId,
    author_profile_id: user.id,
    author_role: authorRole,
    content,
  });

  if (insertError) throw data(null, { status: 404 });

  const now = new Date().toISOString();
  const shouldAnswer = isAdmin && inquiry.status === "pending";
  const updatePayload = shouldAnswer
    ? { last_activity_at: now, status: "answered" as const }
    : { last_activity_at: now };

  const { error: updateError } = await client
    .from("inquiries")
    .update(updatePayload)
    .eq("id", inquiryId);

  if (updateError) throw data(null, { status: 404 });

  // fetcher 기반 전송을 위해 redirect 없이 결과만 반환
  return data({ success: true }, { headers });
}


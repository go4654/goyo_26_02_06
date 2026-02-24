import type { Route } from "../screens/+types/inquiry-detail";

import type { Database } from "database.types";

import { data } from "react-router";

import { getUserRole, requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import type {
  InquiryChatError,
  InquiryChatSendSuccess,
  InquiryChatMessage,
} from "~/features/inquiries/types/chat";

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

  // 닫힌 문의는 메시지 전송 불가 (JSON 반환으로 에러바운더리 방지, 클라이언트에서 revalidate 후 폼 비활성화)
  if (inquiry.status === "closed") {
    return data<InquiryChatError>(
      { error: "문의가 종료되어 추가 메시지를 보낼 수 없습니다." },
      { status: 403, headers },
    );
  }

  // 중요: 역할은 리터럴 유니온("admin" | "user")로 유지합니다.
  const authorRole = isAdmin ? "admin" : "user";

  const { data: inserted, error: insertError } = await client
    .from("inquiry_messages")
    .insert({
      inquiry_id: inquiryId,
      author_profile_id: user.id,
      author_role: authorRole,
      content,
    })
    .select("id, inquiry_id, content, author_profile_id, author_role, created_at")
    .maybeSingle();

  if (insertError) throw data(null, { status: 404 });

  // 중요: return=representation이 RLS/타이밍 이슈로 비어오는 경우가 있어 fallback 조회로 보강합니다.
  const insertedRow =
    inserted ??
    (
      await client
        .from("inquiry_messages")
        .select("id, content, author_profile_id, author_role, created_at")
        .eq("inquiry_id", inquiryId)
        .eq("author_profile_id", user.id)
        .eq("author_role", authorRole)
        .eq("content", content)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ).data;

  if (!insertedRow) throw data(null, { status: 404 });

  const now = new Date().toISOString();
  const shouldAnswer = isAdmin && inquiry.status === "pending";
  const answeredStatus: Database["public"]["Enums"]["inquiry_status"] = "answered";
  const updatePayload = shouldAnswer
    ? { last_activity_at: now, status: answeredStatus }
    : { last_activity_at: now };

  const { error: updateError } = await client
    .from("inquiries")
    .update(updatePayload)
    .eq("id", inquiryId);

  if (updateError) throw data(null, { status: 404 });

  const response: InquiryChatSendSuccess<InquiryChatMessage> = {
    success: true,
    message: {
      id: insertedRow.id,
      content: insertedRow.content,
      authorProfileId: insertedRow.author_profile_id,
      authorRole: insertedRow.author_role,
      createdAt: insertedRow.created_at,
    },
    // 이 화면에서는 상태를 즉시 표시하지 않지만, 관리자 답변 시 서버 상태가 변할 수 있어 내려줍니다.
    updatedStatus: shouldAnswer ? "answered" : null,
  };

  return data<
    InquiryChatSendSuccess<InquiryChatMessage> | InquiryChatError
  >(response, { headers });
}


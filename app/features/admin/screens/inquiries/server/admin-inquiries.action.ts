import type { Route } from "../+types/admin-inquiries-detail";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
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

function isInquiryStatus(
  s: string,
): s is "pending" | "answered" | "closed" {
  return s === "pending" || s === "answered" || s === "closed";
}

type ReplyResponse =
  | InquiryChatSendSuccess<InquiryChatMessage>
  | InquiryChatError;

type StatusChangeResponse = { success: true } | InquiryChatError;

/**
 * 관리자 문의 상세 action
 *
 * - 답변 작성: inquiry_messages insert + inquiries.last_activity_at 갱신 + status answered
 * - 상태 변경: inquiries.status 업데이트 + updated_at 갱신
 *
 * fetcher 기반 제출을 위해 redirect 없이 data만 반환합니다.
 */
export async function adminInquiriesAction({
  request,
  params,
}: Route.ActionArgs) {
  if (request.method !== "POST") throw data(null, { status: 404 });

  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw data(null, { status: 401 });

  const inquiryId = getInquiryId(params);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "reply") {
    const contentRaw = formData.get("content");
    const content = typeof contentRaw === "string" ? contentRaw.trim() : "";
    if (!content)
      return data<ReplyResponse>(
        { error: "내용을 입력해 주세요." },
        { status: 400, headers },
      );

    const { data: inquiry, error: inquiryError } = await client
      .from("inquiries")
      .select("id, status")
      .eq("id", inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return data<ReplyResponse>(
        { error: "문의를 찾을 수 없습니다." },
        { status: 404, headers },
      );
    }

    if (inquiry.status === "closed") {
      return data<ReplyResponse>(
        { error: "닫힌 문의에는 답변을 작성할 수 없습니다." },
        { status: 403, headers },
      );
    }

    const { data: inserted, error: insertError } = await client
      .from("inquiry_messages")
      .insert({
        inquiry_id: inquiryId,
        author_profile_id: user.id,
        author_role: "admin",
        content,
      })
      .select("id, inquiry_id, content, author_profile_id, author_role, created_at")
      .maybeSingle();

    if (insertError) {
      return data<ReplyResponse>(
        { error: `답변 등록 실패: ${insertError?.message ?? "알 수 없음"}` },
        { status: 500, headers },
      );
    }

    // 중요: return=representation이 비어오는 경우가 있어 fallback 조회로 보강합니다.
    const insertedRow =
      inserted ??
      (
        await client
          .from("inquiry_messages")
          .select("id, content, author_profile_id, author_role, created_at")
          .eq("inquiry_id", inquiryId)
          .eq("author_profile_id", user.id)
          .eq("author_role", "admin")
          .eq("content", content)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data;

    if (!insertedRow) {
      return data<ReplyResponse>(
        { error: "답변은 저장되었지만, 응답 메시지 조회에 실패했습니다." },
        { status: 500, headers },
      );
    }

    const now = new Date().toISOString();
    // 중요: pending인 경우에만 "상태 변경"으로 간주합니다. (answered/closed는 그대로 유지)
    const shouldAnswer = inquiry.status === "pending";
    const { error: updateError } = await client
      .from("inquiries")
      .update(
        shouldAnswer
          ? { last_activity_at: now, status: "answered", updated_at: now }
          : { last_activity_at: now, updated_at: now },
      )
      .eq("id", inquiryId);

    if (updateError) {
      return data<ReplyResponse>(
        { error: `문의 상태 갱신 실패: ${updateError.message}` },
        { status: 500, headers },
      );
    }

    const response: InquiryChatSendSuccess<InquiryChatMessage> = {
      success: true,
      message: {
        id: insertedRow.id,
        content: insertedRow.content,
        authorProfileId: insertedRow.author_profile_id,
        authorRole: insertedRow.author_role,
        createdAt: insertedRow.created_at,
      },
      updatedStatus: shouldAnswer ? "answered" : null,
    };

    return data<ReplyResponse>(response, { headers });
  }

  if (intent === "changeStatus") {
    const statusRaw = formData.get("status");
    const status = typeof statusRaw === "string" ? statusRaw : "";
    if (!isInquiryStatus(status))
      return data<StatusChangeResponse>(
        { error: "유효하지 않은 상태값입니다." },
        { status: 400, headers },
      );

    const now = new Date().toISOString();
    const { error } = await client
      .from("inquiries")
      .update({ status, updated_at: now })
      .eq("id", inquiryId);

    if (error) {
      return data<StatusChangeResponse>(
        { error: `상태 변경 실패: ${error.message}` },
        { status: 500, headers },
      );
    }

    return data<StatusChangeResponse>({ success: true }, { headers });
  }

  throw data(null, { status: 404 });
}


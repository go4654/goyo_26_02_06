import type { Route } from "../+types/admin-inquiries-detail";

import type { Database } from "database.types";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

type AdminInquiryDetailRpcRow =
  Database["public"]["Functions"]["get_admin_inquiry_detail"]["Returns"][number];

export interface AdminInquiryDetailInquiry {
  id: string;
  title: string;
  category: string;
  status: "pending" | "answered" | "closed";
  createdAt: string;
  updatedAt: string;
  author: {
    email: string;
    nickname: string;
  };
}

export interface AdminInquiryDetailMessage {
  id: string;
  content: string;
  authorProfileId: string;
  authorRole: "user" | "admin";
  createdAt: string;
}

function isInquiryStatus(
  s: string,
): s is AdminInquiryDetailInquiry["status"] {
  return s === "pending" || s === "answered" || s === "closed";
}

/**
 * 관리자 문의 상세 로더
 *
 * - 관리자 권한 확인
 * - 문의 1건 조회 (작성자 이메일/닉네임 포함)
 * - 메시지 전체 조회 (created_at ASC)
 * - camelCase로 변환하여 반환
 */
export async function adminInquiriesDetailLoader({
  request,
  params,
}: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const id = params.id;
  if (!id) throw data(null, { status: 404 });

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw data(null, { status: 401 });

  const { data: detailRows, error: inquiryError } = await client.rpc(
    "get_admin_inquiry_detail",
    { p_inquiry_id: id },
  );

  if (inquiryError) {
    throw data({ error: inquiryError.message }, { status: 500 });
  }

  const detail: AdminInquiryDetailRpcRow | undefined = detailRows?.[0];
  if (!detail) throw data(null, { status: 404 });

  const status = isInquiryStatus(detail.status) ? detail.status : "pending";

  const inquiry: AdminInquiryDetailInquiry = {
    id: detail.id,
    title: detail.title,
    category: detail.category,
    status,
    createdAt: detail.created_at,
    updatedAt: detail.updated_at,
    author: {
      email: detail.author_email ?? "-",
      nickname: detail.author_nickname ?? "-",
    },
  };

  const { data: messageRows, error: messagesError } = await client
    .from("inquiry_messages")
    .select("id, content, author_profile_id, author_role, created_at")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw data({ error: messagesError.message }, { status: 500 });
  }

  const messages: AdminInquiryDetailMessage[] = (messageRows ?? []).map(
    (m) => ({
      id: m.id,
      content: m.content,
      authorProfileId: m.author_profile_id,
      authorRole: m.author_role,
      createdAt: m.created_at,
    }),
  );

  return data(
    {
      inquiry,
      messages,
      authUserId: user.id,
    },
    { headers },
  );
}

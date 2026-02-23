import type { Route } from "../screens/+types/inquiry-detail";

import { data } from "react-router";

import { getUserRole, requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

export interface InquiryDetailInquiry {
  id: string;
  title: string;
  category: string;
  status: "pending" | "answered" | "closed";
  created_at: string;
  profile_id: string;
}

export interface InquiryDetailMessage {
  id: string;
  authorProfileId: string;
  authorRole: "user" | "admin";
  content: string;
  createdAt: string;
}

function getInquiryId(params: Route.LoaderArgs["params"]): string {
  const inquiryId = params.id;
  if (!inquiryId) throw data(null, { status: 404 });
  return inquiryId;
}

export async function inquiryDetailLoader({
  request,
  params,
}: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const { user, isAdmin } = await getUserRole(client);
  if (!user) throw data(null, { status: 401 });

  const inquiryId = getInquiryId(params);

  const { data: inquiry, error: inquiryError } = await client
    .from("inquiries")
    .select("id, title, category, status, created_at, profile_id")
    .eq("id", inquiryId)
    .single();

  if (inquiryError || !inquiry) throw data(null, { status: 404 });

  // 일반 유저는 본인 문의만 접근 가능 (관리자는 전체 접근)
  if (!isAdmin && inquiry.profile_id !== user.id)
    throw data(null, { status: 403 });

  const { data: messages, error: messagesError } = await client
    .from("inquiry_messages")
    .select("id, author_profile_id, author_role, content, created_at")
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });

  if (messagesError) throw data(null, { status: 404 });

  const normalizedMessages: InquiryDetailMessage[] = (
    (messages ?? []) as Array<{
      id: string;
      author_profile_id: string;
      author_role: "user" | "admin";
      content: string;
      created_at: string;
    }>
  ).map((m) => ({
    id: m.id,
    authorProfileId: m.author_profile_id,
    authorRole: m.author_role,
    content: m.content,
    createdAt: m.created_at,
  }));

  return data(
    {
      inquiry: inquiry as InquiryDetailInquiry,
      messages: normalizedMessages,
      isAdmin,
      authUserId: user.id,
    },
    { headers },
  );
}

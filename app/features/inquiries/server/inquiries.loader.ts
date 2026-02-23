import type { Route } from "../screens/+types/inquiry-list";

import { data } from "react-router";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/** loader 반환용 문의 목록 한 건 (camelCase) */ export interface InquiryListItem {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  lastActivityAt: string;
}
/** Supabase 조회 행 (snake_case) */ interface InquiryRow {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  last_activity_at: string;
}
function toInquiryListItem(row: InquiryRow): InquiryListItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
  };
}
/**
 * 내 문의 목록 loader
 * - 로그인 필수 (requireAuthentication)
 * - RLS가 profile_id로 필터링하므로 현재 유저 기준으로 select 후 최신순 정렬
 * - 세션 갱신/쿠키 반영을 위해 headers 포함 반환
 */
export async function inquiriesLoader({
  request,
}: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  const { data: rows, error } = await client
    .from("inquiries")
    .select("id, title, category, status, created_at, last_activity_at")
    .eq("profile_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Response("문의 목록을 찾을 수 없습니다.", { status: 404 });
  }

  const inquiries = ((rows ?? []) as InquiryRow[]).map(toInquiryListItem);
  return data({ inquiries }, { headers });
}

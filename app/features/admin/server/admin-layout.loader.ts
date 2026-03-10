import type { Route } from "../layouts/+types/admin.layout";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

const ADMIN_USERS_SEEN_AT_COOKIE = "goyo_admin_users_seen_at";

/** UTC 기준 당일 00:00:00 */
function getTodayStartUTC(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/** 요청 쿠키에서 회원 목록 마지막 확인 시각(ISO) 반환, 없으면 null */
function getUsersListLastSeenAt(request: Request): string | null {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie.match(
    new RegExp(`${ADMIN_USERS_SEEN_AT_COOKIE}=([^;]+)`),
  );
  const value = match?.[1] ? decodeURIComponent(match[1].trim()) : null;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * 관리자 레이아웃 로더
 * - requireAdmin으로 관리자 권한 확인
 * - pending 문의 개수, 확인 안 한 신규 가입자 수 조회 (사이드바 뱃지용)
 * - 회원 목록 방문 후에는 해당 시각 이후 가입자만 배지에 포함
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  const user = await requireAdmin(client);

  const lastSeenAt = getUsersListLastSeenAt(request);
  const todayStart = getTodayStartUTC();
  const since = lastSeenAt ?? todayStart;

  const [inquiryResult, newUsersResult] = await Promise.all([
    client
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("is_deleted", false),
    client
      .from("profiles")
      .select("profile_id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);

  return data(
    {
      user,
      pendingInquiryCount: inquiryResult.count ?? 0,
      todayUsersCount: newUsersResult.count ?? 0,
    },
    { headers },
  );
}

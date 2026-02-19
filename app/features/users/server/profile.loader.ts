import type { Route } from "../screens/+types/profile";

import { redirect } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLecturesByCategory } from "~/features/class/constants/class-data";

import { getUserProfile } from "../queries";

export async function profileLoader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw redirect("/login");
  }

  // 보안: slug가 현재 사용자의 ID와 일치하는지 확인
  // 다른 사용자의 프로필 접근 시도 차단
  // getUserProfile 함수 내부에서도 이중 검증 수행
  if (params.slug !== user.user_metadata.name) {
    // 본인의 프로필이 아니면 본인 프로필로 리다이렉트
    throw redirect("/");
  }

  // getUserProfile 함수가 내부적으로 userId 검증을 수행하므로
  // 다른 사용자의 프로필 조회 시도는 자동으로 차단됨
  const profile = await getUserProfile(client, { userId: user.id });

  if (!profile) {
    // 프로필이 없으면 본인 프로필 페이지로 리다이렉트
    throw redirect("/user/profile");
  }

  // 저장한 학습 자료 카테고리 (임시로 URL 쿼리 파라미터에서 가져옴)
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "class";

  // 프로필 집계: 저장한 클래스/갤러리 수, 이번주 학습 수 (RPC 1회 호출)
  const { data: statsRows, error: statsError } = await client.rpc(
    "get_profile_stats",
  );
  if (statsError) {
    throw statsError;
  }
  const stats = Array.isArray(statsRows) ? statsRows[0] : statsRows;
  const savedClassCount = Number(stats?.saved_class_count ?? 0);
  const savedGalleryCount = Number(stats?.saved_gallery_count ?? 0);
  const weeklyLearningCount = Number(stats?.weekly_learning_count ?? 0);

  // 학습 요약: 가장 많이 탐색한 분야, 마지막 학습일, 최근 학습 주제 (RPC 1회 호출)
  const { data: summaryRows, error: summaryError } = await client.rpc(
    "get_profile_learning_summary",
    { user_uuid: user.id },
  );
  if (summaryError) {
    throw summaryError;
  }
  const summaryRow = Array.isArray(summaryRows) ? summaryRows[0] : summaryRows;
  const learningSummary = {
    mostExploredCategory: (summaryRow?.most_explored_category as string) ?? null,
    lastLearningDate: summaryRow?.last_learning_date
      ? new Date(summaryRow.last_learning_date as string)
      : null,
    recentTopics: (summaryRow?.recent_topics as string[]) ?? [],
  };

  // 최근 조회 (클래스/갤러리) — 최근 학습 주제 링크용
  const { data: recentViewsRows, error: recentViewsError } = await client.rpc(
    "get_profile_recent_views",
    { user_uuid: user.id },
  );
  if (recentViewsError) {
    throw recentViewsError;
  }
  type RecentViewRow = { id: string; title: string; slug?: string; category: string; type: string; viewed_at: string };
  const recentViews = (Array.isArray(recentViewsRows) ? recentViewsRows : []).map((row: RecentViewRow) => ({
    id: row.id,
    title: row.title,
    slug: row.slug ?? "",
    category: row.category,
    type: row.type as "class" | "gallery",
    viewedAt: row.viewed_at ? new Date(row.viewed_at) : null,
  }));

  // TODO: 나중에 Supabase 연동 시 여기서 실제 저장된 데이터 가져오기
  // const { data: savedLectures } = await client
  //   .from("saved_lectures")
  //   .select("*")
  //   .eq("user_id", user.id)
  //   .eq("type", category);
  const savedLectures = getLecturesByCategory(null); // 임시 데이터

  return {
    profile,
    email: user.email,
    category,
    savedLectures,
    savedClassCount,
    savedGalleryCount,
    weeklyLearningCount,
    learningSummary,
    recentViews,
  };
}

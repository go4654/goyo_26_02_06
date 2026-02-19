import type { Route } from "../screens/+types/profile";

import { redirect } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLecturesByCategory } from "~/features/class/constants/class-data";

import { getUserProfile } from "../queries";

/** 통합 RPC get_profile_page_data 반환 구조 (타입 안전) */
interface ProfilePageData {
  stats: {
    saved_class_count: number;
    saved_gallery_count: number;
    weekly_learning_count: number;
  };
  learning_summary: {
    most_explored_category: string | null;
    last_learning_date: string | null;
    recent_topics: string[];
    total_saved_classes: number;
    total_saved_galleries: number;
  };
  weekly_learning: Array<{ date: string; view_count: number }>;
  recent_views: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    type: string;
    viewed_at: string;
  }>;
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

export async function profileLoader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw redirect("/login");
  }

  if (params.slug !== user.user_metadata.name) {
    throw redirect("/");
  }

  const profile = await getUserProfile(client, { userId: user.id });

  if (!profile) {
    throw redirect("/user/profile");
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "class";

  // 통합 RPC 1회 호출: 프로필 집계·학습 요약·주간 차트·최근 조회
  const { data: pageData, error: pageError } = await (
    client.rpc as (fn: string, args?: Record<string, unknown>) => ReturnType<typeof client.rpc>
  )("get_profile_page_data", { p_user_uuid: user.id });
  if (pageError) {
    throw pageError;
  }

  const raw = (pageData ?? {}) as unknown as ProfilePageData;
  const stats = raw.stats ?? {};
  const learningSummaryRaw = raw.learning_summary ?? {};
  const weeklyRows = Array.isArray(raw.weekly_learning) ? raw.weekly_learning : [];
  const recentViewsRaw = Array.isArray(raw.recent_views) ? raw.recent_views : [];

  const savedClassCount = Number(stats.saved_class_count ?? 0);
  const savedGalleryCount = Number(stats.saved_gallery_count ?? 0);
  const weeklyLearningCount = Number(stats.weekly_learning_count ?? 0);

  const learningSummary = {
    mostExploredCategory: (learningSummaryRaw.most_explored_category as string) ?? null,
    lastLearningDate: learningSummaryRaw.last_learning_date
      ? new Date(learningSummaryRaw.last_learning_date)
      : null,
    recentTopics: (learningSummaryRaw.recent_topics ?? []) as string[],
  };

  const recentViews = recentViewsRaw.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug ?? "",
    category: row.category,
    type: row.type as "class" | "gallery",
    viewedAt: row.viewed_at ? new Date(row.viewed_at) : null,
  }));

  const weeklyLearningChartData: {
    date: string;
    dateDisplay: string;
    weekday: string;
    views: number;
  }[] = weeklyRows.map((row) => {
    const dateStr = typeof row.date === "string" ? row.date.slice(0, 10) : "";
    const [y, m, d] = dateStr.length >= 10 ? dateStr.split("-") : ["", "", ""];
    const weekdayIndex =
      y && m && d ? new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))).getUTCDay() : 0;
    const weekday = WEEKDAYS_KO[weekdayIndex];
    const dateDisplay = y && m && d ? `${m}.${d}` : "";
    return {
      date: dateStr,
      dateDisplay,
      weekday: weekday ?? "일",
      views: Number(row.view_count) ?? 0,
    };
  });

  const savedLectures = getLecturesByCategory(null); // TODO: 저장 목록 Supabase 연동

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
    weeklyLearningChartData,
  };
}

import type { Route } from "../screens/+types/profile";

import { redirect } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import { SAVED_ITEMS_PAGE_SIZE } from "../constants";
import { getUserProfile } from "../queries";

/** get_saved_classes RPC 행 → 저장 클래스 목록용 */
interface SavedClassRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_image_url: string | null;
}

/** get_saved_galleries RPC 행 → 저장 갤러리 목록용 */
interface SavedGalleryRow {
  id: string;
  title: string;
  slug: string;
  thumbnail_image_url: string | null;
  like_count: number;
  save_count: number;
  tags: string[];
}

function normalizeSavedClassRow(row: {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_image_url?: string | null;
}): SavedClassRow {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    thumbnail_image_url: row.thumbnail_image_url ?? null,
  };
}

function normalizeSavedGalleryRow(row: {
  id: string;
  title: string;
  slug: string;
  thumbnail_image_url?: string | null;
}): SavedGalleryRow {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    thumbnail_image_url: row.thumbnail_image_url ?? null,
    like_count: 0,
    save_count: 0,
    tags: [],
  };
}

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

  // 통합 RPC 1회 호출: 프로필 집계·학습 요약·주간 차트·최근 조회 (client 컨텍스트 유지)
  const { data: pageData, error: pageError } = await (
    client as {
      rpc: (
        fn: string,
        args?: Record<string, unknown>,
      ) => ReturnType<typeof client.rpc>;
    }
  ).rpc("get_profile_page_data", { p_user_uuid: user.id });
  if (pageError) {
    throw pageError;
  }

  const raw = (pageData ?? {}) as unknown as ProfilePageData;
  const stats = raw.stats ?? {};
  const learningSummaryRaw = raw.learning_summary ?? {};
  const weeklyRows = Array.isArray(raw.weekly_learning)
    ? raw.weekly_learning
    : [];
  const recentViewsRaw = Array.isArray(raw.recent_views)
    ? raw.recent_views
    : [];

  const savedClassCount = Number(stats.saved_class_count ?? 0);
  const savedGalleryCount = Number(stats.saved_gallery_count ?? 0);
  const weeklyLearningCount = Number(stats.weekly_learning_count ?? 0);

  const learningSummary = {
    mostExploredCategory:
      (learningSummaryRaw.most_explored_category as string) ?? null,
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
      y && m && d
        ? new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))).getUTCDay()
        : 0;
    const weekday = WEEKDAYS_KO[weekdayIndex];
    const dateDisplay = y && m && d ? `${m}.${d}` : "";
    return {
      date: dateStr,
      dateDisplay,
      weekday: weekday ?? "일",
      views: Number(row.view_count) ?? 0,
    };
  });

  // 저장한 클래스 / 갤러리 첫 페이지. client.rpc()로 호출해 this 바인딩 유지
  const rpcClient = client as {
    rpc: (
      fn: string,
      args?: Record<string, unknown>,
    ) => ReturnType<typeof client.rpc>;
  };
  const savedRpcArgs = {
    p_user_uuid: user.id,
    p_page_limit: SAVED_ITEMS_PAGE_SIZE,
    p_page_offset: 0,
  };

  let savedClasses: SavedClassRow[] = [];
  let savedGalleries: SavedGalleryRow[] = [];

  const { data: savedClassesRows, error: savedClassError } =
    await rpcClient.rpc("get_saved_classes", savedRpcArgs);
  if (!savedClassError && Array.isArray(savedClassesRows)) {
    savedClasses = savedClassesRows.map(normalizeSavedClassRow);
  }

  const { data: savedGalleriesRows, error: savedGalleryError } =
    await rpcClient.rpc("get_saved_galleries", savedRpcArgs);
  if (!savedGalleryError && Array.isArray(savedGalleriesRows)) {
    savedGalleries = savedGalleriesRows.map(normalizeSavedGalleryRow);
  }

  return {
    profile,
    email: user.email,
    category,
    savedClassCount,
    savedGalleryCount,
    weeklyLearningCount,
    learningSummary,
    recentViews,
    weeklyLearningChartData,
    savedClasses,
    savedGalleries,
  };
}

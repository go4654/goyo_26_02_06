/**
 * 뉴스 데이터베이스 쿼리
 *
 * - 목록 조회(페이지네이션), 슬러그 기준 상세 조회, 조회 이벤트 기록
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "~/core/utils/logger";

/** 뉴스 목록 조회 파라미터 */
export interface GetNewsListParams {
  page?: number;
  pageSize?: number;
}

/** 뉴스 목록 조회 결과 */
export interface GetNewsListResult {
  items: NewsListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/** 뉴스 목록 한 건 (UI용) */
export interface NewsListItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  published_at: string | null;
  view_count: number;
}

/** 뉴스 상세 (상세 페이지용) */
export interface NewsDetail {
  id: string;
  slug: string;
  title: string;
  category: string;
  content_mdx: string;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * 공개 뉴스 목록 조회 (페이지네이션)
 * is_published = true, visibility 정책은 RLS에서 처리
 */
export async function getNewsList(
  client: SupabaseClient,
  params: GetNewsListParams = {},
): Promise<GetNewsListResult> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: rows, count, error } = await client
    .from("news")
    .select("id, slug, title, category, published_at, view_count", {
      count: "exact",
    })
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`뉴스 목록 조회 실패: ${error.message}`);
  }

  const totalCount = count ?? 0;
  const list = (rows ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    category: string;
    published_at: string | null;
    view_count: number;
  }>;

  const items: NewsListItem[] = list.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    published_at: r.published_at ?? null,
    view_count: r.view_count ?? 0,
  }));

  return {
    items,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
    pageSize,
  };
}

/**
 * 슬러그로 뉴스 상세 조회
 */
export async function getNewsBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<NewsDetail | null> {
  const { data: row, error } = await client
    .from("news")
    .select("id, slug, title, category, content_mdx, view_count, published_at, created_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !row) {
    if (error?.code === "PGRST116") return null;
    throw new Error(`뉴스 상세 조회 실패: ${error?.message ?? "unknown"}`);
  }

  const r = row as {
    id: string;
    slug: string;
    title: string;
    category: string;
    content_mdx: string;
    view_count: number;
    published_at: string | null;
    created_at: string;
  };

  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    content_mdx: r.content_mdx,
    view_count: r.view_count ?? 0,
    published_at: r.published_at ?? null,
    created_at: r.created_at,
  };
}

/**
 * 뉴스 조회 이벤트 기록 (트리거로 news.view_count 자동 증가)
 */
export async function incrementNewsView(
  client: SupabaseClient,
  newsId: string,
  userId: string | null,
): Promise<void> {
  const { error } = await client.from("news_view_events").insert({
    news_id: newsId,
    user_id: userId,
  });
  if (error) {
    logger.error("[incrementNewsView]", error.message);
    throw new Error("뉴스 조회 이벤트 기록에 실패했습니다.");
  }
}

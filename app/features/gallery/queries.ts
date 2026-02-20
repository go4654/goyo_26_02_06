/**
 * 갤러리 데이터베이스 쿼리 함수
 *
 * galleries 테이블 조회, 페이지네이션, 카테고리(컬럼) 필터, 검색을 제공합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "~/core/utils/logger";

/** 갤러리 목록 조회 파라미터 */
export interface GetGalleriesParams {
  /** 카테고리 필터 (galleries.category, 'all' 또는 null이면 전체) */
  category?: string | null;
  /** 검색어 (선택사항) */
  search?: string | null;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지당 항목 수 */
  pageSize?: number;
}

/** 갤러리 목록 조회 결과 */
export interface GetGalleriesResult {
  galleries: GalleryListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/** 갤러리 목록 아이템 (UI용) */
export interface GalleryListItem {
  id: string;
  title: string;
  slug: string;
  thumbnail_image_url: string | null;
  like_count: number;
  save_count: number;
  tags: string[];
}

/** 갤러리 상세 (상세 페이지용) */
export interface GalleryDetail {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  caption: string | null;
  thumbnail_image_url: string | null;
  image_urls: string[];
  like_count: number;
  save_count: number;
  tags: string[];
  created_at: string;
}

/** 현재 유저의 좋아요/저장 여부 */
export interface GalleryUserActions {
  liked: boolean;
  saved: boolean;
}

/** 이전/다음 갤러리 네비게이션용 */
export interface AdjacentGalleries {
  prevSlug: string | null;
  nextSlug: string | null;
}

/** Supabase 갤러리 행 + 중첩 태그 (API 응답 형태) */
interface GalleryRowWithTags {
  id: string;
  title: string;
  slug: string;
  thumbnail_image_url: string | null;
  like_count: number;
  save_count?: number;
  gallery_tags: Array<{ tags: { name: string } | null }>;
}

/** Supabase 갤러리 상세 행 (API 응답 형태) */
interface GalleryDetailRow {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  caption: string | null;
  thumbnail_image_url: string | null;
  image_urls: string[] | null;
  like_count: number;
  save_count: number;
  created_at: string;
  gallery_tags: Array<{ tags: { name: string } | null }>;
}

/**
 * 갤러리 목록 조회 (페이지네이션 + 선택적 카테고리 필터)
 *
 * - 공개(is_published) 갤러리만 조회
 * - 카테고리가 'all'이 아니면 galleries.category로 필터
 * - 검색어가 있으면 title 기준으로 부분 일치 검색
 * - 태그 이름은 gallery_tags → tags 조인으로 함께 조회
 */
export async function getGalleries(
  client: SupabaseClient,
  params: GetGalleriesParams = {},
): Promise<GetGalleriesResult> {
  const { category = null, search = null, page = 1, pageSize = 12 } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from("galleries")
    .select(
      "id, title, slug, thumbnail_image_url, like_count, save_count, gallery_tags(tags(name))",
      { count: "exact" },
    )
    .eq("is_published", true)
    // 좋아요/저장 등으로 updated_at이 바뀌어도 목록 순서가 흔들리지 않도록 created_at + id로 안정화
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  // 카테고리 필터 (첫 진입은 all로 전체 노출)
  if (category && category !== "all") query = query.eq("category", category);

  // 검색 필터 (제목 기준 부분 일치)
  if (search && search.trim().length > 0) {
    const keyword = search.trim();
    query = query.ilike("title", `%${keyword}%`);
  }

  const { data: rows, count, error } = await query.range(from, to);
  const totalCount = count ?? 0;

  if (error) {
    throw new Error(`갤러리 목록 조회 실패: ${error.message}`);
  }

  const raw = (rows ?? []) as unknown as GalleryRowWithTags[];
  const galleries: GalleryListItem[] = raw.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    thumbnail_image_url: row.thumbnail_image_url ?? null,
    like_count: row.like_count ?? 0,
    save_count: row.save_count ?? 0,
    tags: (row.gallery_tags ?? [])
      .map((gt) => gt.tags?.name)
      .filter((name): name is string => typeof name === "string"),
  }));

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    galleries,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}

/**
 * 슬러그로 갤러리 상세 조회 (태그 포함)
 * 공개(is_published) 갤러리만 조회하며, 없으면 null 반환
 */
export async function getGalleryBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<GalleryDetail | null> {
  const { data: row, error } = await client
    .from("galleries")
    .select(
      "id, title, slug, subtitle, description, caption, thumbnail_image_url, image_urls, like_count, save_count, created_at, gallery_tags(tags(name))",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !row) {
    if (error?.code === "PGRST116") return null; // no rows
    throw new Error(`갤러리 상세 조회 실패: ${error?.message ?? "unknown"}`);
  }

  const r = row as unknown as GalleryDetailRow;
  const tags = (r.gallery_tags ?? [])
    .map((gt) => gt.tags?.name)
    .filter((name): name is string => typeof name === "string");

  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    subtitle: r.subtitle ?? null,
    description: r.description ?? null,
    caption: r.caption ?? null,
    thumbnail_image_url: r.thumbnail_image_url ?? null,
    image_urls: Array.isArray(r.image_urls) ? r.image_urls : [],
    like_count: r.like_count ?? 0,
    save_count: r.save_count ?? 0,
    tags,
    created_at: r.created_at,
  };
}

/**
 * 현재 유저의 해당 갤러리에 대한 좋아요/저장 여부 조회
 */
export async function getGalleryUserActions(
  client: SupabaseClient,
  galleryId: string,
  userId: string,
): Promise<GalleryUserActions> {
  const [likeRes, saveRes] = await Promise.all([
    client
      .from("gallery_likes")
      .select("id", { count: "exact", head: true })
      .eq("gallery_id", galleryId)
      .eq("user_id", userId)
      .limit(1),
    client
      .from("gallery_saves")
      .select("id", { count: "exact", head: true })
      .eq("gallery_id", galleryId)
      .eq("user_id", userId)
      .limit(1),
  ]);

  return {
    liked: (likeRes.count ?? 0) > 0,
    saved: (saveRes.count ?? 0) > 0,
  };
}

/**
 * 목록과 동일한 정렬(created_at desc, id desc)로 슬러그 목록을 조회한 뒤,
 * 현재 슬러그 위치 기준으로 이전/다음 슬러그를 반환합니다.
 * 목록에서 "이전" = 더 최신 글, "다음" = 더 오래된 글.
 */
export async function getAdjacentGallerySlugs(
  client: SupabaseClient,
  currentSlug: string,
  _currentCreatedAt: string,
): Promise<AdjacentGalleries> {
  const { data: rows, error } = await client
    .from("galleries")
    .select("slug")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);

  if (error) {
    logger.error("[getAdjacentGallerySlugs]", error.message);
    return { prevSlug: null, nextSlug: null };
  }

  const list = Array.isArray(rows) ? rows : [];
  const slugs = list
    .map((r: { slug?: unknown }) =>
      typeof r?.slug === "string" && r.slug.length > 0 ? r.slug : null,
    )
    .filter((s): s is string => s != null);

  const idx = slugs.indexOf(currentSlug);
  if (idx === -1) return { prevSlug: null, nextSlug: null };

  return {
    prevSlug: idx > 0 ? slugs[idx - 1] ?? null : null,
    nextSlug: idx < slugs.length - 1 ? slugs[idx + 1] ?? null : null,
  };
}

/**
 * 갤러리 조회수 증가
 *
 * 상세 페이지 조회 시 gallery_view_events에 이벤트를 삽입합니다.
 * DB 트리거(trigger_increment_gallery_view_count)가 galleries.view_count를 자동 증가시킵니다.
 *
 * @param client - Supabase 클라이언트
 * @param galleryId - 갤러리 ID
 * @param userId - 로그인 유저 ID (null이면 anon 정책으로 삽입)
 */
export async function incrementGalleryView(
  client: SupabaseClient,
  galleryId: string,
  userId: string | null,
): Promise<void> {
  const { error } = await client.from("gallery_view_events").insert({
    gallery_id: galleryId,
    user_id: userId,
  });
  if (error) {
    logger.error("[incrementGalleryView]", error.message);
    throw new Error("갤러리 조회 이벤트 기록에 실패했습니다.");
  }
}

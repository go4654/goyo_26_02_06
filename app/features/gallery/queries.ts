/**
 * 갤러리 데이터베이스 쿼리 함수
 *
 * galleries 테이블 조회, 페이지네이션, 카테고리(컬럼) 필터, 검색을 제공합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

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
  tags: string[];
}

/** Supabase 갤러리 행 + 중첩 태그 (API 응답 형태) */
interface GalleryRowWithTags {
  id: string;
  title: string;
  slug: string;
  thumbnail_image_url: string | null;
  like_count: number;
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
      "id, title, slug, thumbnail_image_url, like_count, gallery_tags(tags(name))",
      { count: "exact" },
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

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

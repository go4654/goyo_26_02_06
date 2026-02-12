/**
 * 클래스 데이터베이스 쿼리 함수
 *
 * 이 파일은 classes 테이블에서 데이터를 조회하는 함수들을 제공합니다.
 * 페이지네이션, 필터링, 정렬 등의 기능을 포함합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/**
 * 클래스 목록 조회 파라미터
 */
export interface GetClassesParams {
  /** 카테고리 필터 (선택사항) */
  category?: string | null;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지당 항목 수 */
  pageSize?: number;
  /** 검색어 (선택사항) */
  search?: string | null;
}

/**
 * 클래스 목록 조회 결과
 */
export interface GetClassesResult {
  /** 클래스 목록 */
  classes: ClassListItem[];
  /** 전체 항목 수 */
  totalCount: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 현재 페이지 */
  currentPage: number;
  /** 페이지당 항목 수 */
  pageSize: number;
}

/**
 * 클래스 목록 아이템 타입
 * UI에서 사용하는 최소한의 필드만 포함
 */
export interface ClassListItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  slug: string;
  thumbnail_image_url: string | null;
  view_count: number;
  like_count: number;
  save_count: number;
  comment_count: number;
  published_at: string | null;
  created_at: string;
}

/**
 * 클래스 목록 조회
 *
 * 공개된 클래스만 조회하며, RLS 정책에 따라 접근 권한이 자동으로 적용됩니다.
 * 페이지네이션, 카테고리 필터링, 검색 기능을 지원합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param params - 조회 파라미터
 * @returns 클래스 목록 및 페이지네이션 정보
 */
export async function getClasses(
  client: SupabaseClient<Database>,
  params: GetClassesParams = {},
): Promise<GetClassesResult> {
  const { category = null, page = 1, pageSize = 12, search = null } = params;

  // 기본 쿼리 빌더 생성
  let query = client
    .from("classes")
    .select(
      "id, title, description, category, slug, thumbnail_image_url, view_count, like_count, save_count, comment_count, published_at, created_at",
      {
        count: "exact",
      },
    )
    .eq("is_deleted", false)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  // 카테고리 필터 적용
  if (category) {
    query = query.eq("category", category);
  }

  // 검색어 필터 적용 (제목 또는 설명에서 검색)
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // 페이지네이션 적용
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  // 쿼리 실행
  const { data, error, count } = await query;

  if (error) {
    throw new Error(`클래스 목록 조회 실패: ${error.message}`);
  }

  // 전체 페이지 수 계산
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    classes: (data as ClassListItem[]) ?? [],
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}

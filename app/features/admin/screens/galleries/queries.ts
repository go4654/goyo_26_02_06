/**
 * 관리자용 갤러리 데이터베이스 쿼리 함수
 *
 * 관리자 페이지에서 galleries 테이블 데이터를 조회합니다.
 * requireAdmin을 통해 보호된 로더에서만 사용합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/**
 * 관리자용 갤러리 목록 행 타입
 * 테이블에 표시할 필드만 포함 (클래스 어드민과 동일한 네이밍 패턴)
 */
export interface AdminGalleryRow {
  id: string;
  title: string;
  category: string;
  like_count: number;
  save_count: number;
  view_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  slug: string;
}

/**
 * 관리자용 갤러리 목록 조회
 *
 * @param client - Supabase 클라이언트 (관리자 권한 필요)
 * @returns 갤러리 목록 배열
 */
export async function getAdminGalleries(
  client: SupabaseClient<Database>,
): Promise<AdminGalleryRow[]> {
  const { data, error } = await client
    .from("galleries")
    .select(
      "id, title, category, like_count, save_count, view_count, is_published, created_at, updated_at, slug",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`갤러리 목록 조회 실패: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id as string,
    title: item.title as string,
    category: item.category as string,
    like_count: item.like_count as number,
    save_count: item.save_count as number,
    view_count: item.view_count as number,
    is_published: item.is_published as boolean,
    created_at: item.created_at as string,
    updated_at: item.updated_at as string,
    slug: item.slug as string,
  }));
}

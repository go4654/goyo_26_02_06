/**
 * 관리자용 클래스 데이터베이스 쿼리 함수
 *
 * 이 파일은 관리자 페이지에서 classes 테이블의 데이터를 조회하는 함수들을 제공합니다.
 * 관리자 권한이 필요한 쿼리이므로 requireAdmin을 통해 보호되어야 합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/**
 * 관리자용 클래스 목록 아이템 타입
 * 테이블에 표시할 필드만 포함
 */
export interface AdminClassRow {
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
 * 관리자용 클래스 목록 조회
 *
 * 관리자 권한이 있는 사용자만 사용 가능합니다.
 * 모든 클래스를 조회하며 (is_deleted=false인 것만), RLS 정책에 따라 관리자만 접근 가능합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스 (관리자 권한 필요)
 * @returns 클래스 목록 배열
 */
export async function getAdminClasses(
  client: SupabaseClient<Database>,
): Promise<AdminClassRow[]> {
  const { data, error } = await client
    .from("classes")
    .select("id, title, category, like_count, save_count, view_count, is_published, created_at, updated_at, slug")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`클래스 목록 조회 실패: ${error.message}`);
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

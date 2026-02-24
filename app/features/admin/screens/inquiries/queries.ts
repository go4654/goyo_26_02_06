/**
 * 관리자용 문의 데이터베이스 쿼리 함수
 *
 * 관리자 페이지에서 문의 목록을 조회합니다.
 * requireAdmin을 통해 보호된 로더에서만 사용합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/** RPC 반환 행 타입 */
type AdminInquiriesListRow =
  Database["public"]["Functions"]["get_admin_inquiries_list"]["Returns"][number];

/**
 * 관리자용 문의 목록 행 타입
 * 테이블에 표시할 필드만 포함 (갤러리/클래스 어드민과 동일한 네이밍 패턴)
 */
export interface AdminInquiryRow {
  id: string;
  title: string;
  email: string;
  nickname: string;
  status: "pending" | "answered" | "closed";
  created_at: string;
  updated_at: string;
}

/**
 * 관리자용 문의 목록 조회
 *
 * @param client - Supabase 클라이언트 (관리자 권한 필요)
 * @returns 문의 목록 배열 (created_at DESC)
 */
export async function getAdminInquiries(
  client: SupabaseClient<Database>,
): Promise<AdminInquiryRow[]> {
  const { data, error } = await client.rpc("get_admin_inquiries_list");

  if (error) {
    throw new Error(`문의 목록 조회 실패: ${error.message}`);
  }

  const list = (data ?? []) as AdminInquiriesListRow[];

  function isInquiryStatus(
    s: string,
  ): s is AdminInquiryRow["status"] {
    return s === "pending" || s === "answered" || s === "closed";
  }

  return list.map((row) => ({
    id: row.id,
    title: row.title,
    email: row.email ?? "-",
    nickname: row.nickname ?? "-",
    status: isInquiryStatus(row.status) ? row.status : "pending",
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

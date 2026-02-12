import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/**
 * 일반 유저용 프로필 타입
 * 민감한 필드(role, gallery_access, is_blocked, blocked_reason)는 제외됩니다.
 */
export type PublicProfile = Omit<
  Database["public"]["Tables"]["profiles"]["Row"],
  "role" | "gallery_access" | "is_blocked" | "blocked_reason"
>;

/**
 * Admin용 프로필 타입
 * 모든 필드를 포함합니다.
 */
export type AdminProfile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * 일반 유저용 프로필 조회
 *
 * 보안 강화:
 * - 민감한 필드(role, gallery_access, is_blocked, blocked_reason)는 제외
 * - 요청한 userId가 현재 로그인한 사용자와 일치하는지 검증
 * - 다른 사용자의 프로필 조회 시도 차단
 *
 * @param client - Supabase 클라이언트
 * @param userId - 조회할 사용자 ID (현재 로그인한 사용자와 일치해야 함)
 * @returns 민감 필드가 제외된 프로필 데이터 또는 null
 * @throws 다른 사용자의 프로필 조회 시도 시 에러
 */
export async function getUserProfile(
  client: SupabaseClient<Database>,
  { userId }: { userId: string | null },
): Promise<PublicProfile | null> {
  if (!userId) {
    return null;
  }

  // 현재 로그인한 사용자 확인
  const {
    data: { user: currentUser },
  } = await client.auth.getUser();

  if (!currentUser) {
    throw new Error("인증되지 않은 사용자입니다.");
  }

  // 보안: 요청한 userId가 현재 로그인한 사용자와 일치하는지 검증
  if (userId !== currentUser.id) {
    throw new Error("다른 사용자의 프로필에 접근할 수 없습니다.");
  }

  // 민감 필드 제외하고 조회
  const { data, error } = await client
    .from("profiles")
    .select(
      "profile_id, name, avatar_url, marketing_consent, last_active_at, created_at, updated_at",
    )
    .eq("profile_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data as PublicProfile;
}

/**
 * Admin용 프로필 조회
 *
 * 보안 강화:
 * - Admin 권한이 있는 사용자만 사용 가능
 * - 모든 필드(민감 필드 포함)를 반환
 * - 다른 사용자의 프로필도 조회 가능 (Admin 권한 필요)
 *
 * @param client - Supabase 클라이언트
 * @param userId - 조회할 사용자 ID
 * @returns 모든 필드를 포함한 프로필 데이터 또는 null
 * @throws Admin 권한이 없는 경우 에러
 */
export async function getAdminProfile(
  client: SupabaseClient<Database>,
  { userId }: { userId: string | null },
): Promise<AdminProfile | null> {
  if (!userId) {
    return null;
  }

  // Admin 권한 확인
  const {
    data: { user: currentUser },
  } = await client.auth.getUser();

  if (!currentUser) {
    throw new Error("인증되지 않은 사용자입니다.");
  }

  // Admin 권한 확인
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("profile_id", currentUser.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("관리자 권한이 필요합니다.");
  }

  // 모든 필드 조회
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("profile_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data as AdminProfile;
}

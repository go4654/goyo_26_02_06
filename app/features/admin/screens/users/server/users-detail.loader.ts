import type { Route } from "../+types/admin-users-edit";

/**
 * 유저 상세 정보 타입
 * 수정 페이지에서 사용하는 전체 유저 데이터
 */
export type AdminUserDetail = {
  id: string;
  email: string;
  nickname: string;
  galleryAccess: boolean; // 포폴 접근 권한
  status: "active" | "suspended"; // 계정 상태
  adminMemo: string; // 관리자 메모
  createdAt: string; // 가입일
  lastActiveAt: string; // 최근 활동일
};

/**
 * 유저 상세 정보 로더
 * slug를 기반으로 유저 데이터를 가져옵니다.
 *
 * @param params - 라우트 파라미터 (slug 포함)
 * @returns 유저 상세 정보
 */
export async function userDetailLoader({
  params,
}: Route.LoaderArgs): Promise<{ user: AdminUserDetail }> {
  const { slug } = params;

  // TODO: Supabase에서 실제 데이터 가져오기
  // 현재는 mock 데이터 사용
  const mockUsers: Record<string, AdminUserDetail> = {
    user_001: {
      id: "user_001",
      email: "user1@example.com",
      nickname: "디자이너김",
      galleryAccess: true,
      status: "active",
      adminMemo: "디자인 포트폴리오가 우수한 사용자입니다.",
      createdAt: "2025-11-15T08:00:00.000Z",
      lastActiveAt: "2026-02-10T14:30:00.000Z",
    },
    user_002: {
      id: "user_002",
      email: "user2@example.com",
      nickname: "프론트개발자",
      galleryAccess: false,
      status: "active",
      adminMemo: "",
      createdAt: "2025-12-01T10:15:00.000Z",
      lastActiveAt: "2026-02-11T09:20:00.000Z",
    },
    user_003: {
      id: "user_003",
      email: "user3@example.com",
      nickname: "백엔드마스터",
      galleryAccess: true,
      status: "suspended",
      adminMemo: "부적절한 행동으로 인해 계정 정지 처리되었습니다.",
      createdAt: "2025-10-20T11:30:00.000Z",
      lastActiveAt: "2026-01-25T16:45:00.000Z",
    },
    user_004: {
      id: "user_004",
      email: "user4@example.com",
      nickname: "풀스택개발자",
      galleryAccess: false,
      status: "active",
      adminMemo: "",
      createdAt: "2026-01-10T09:00:00.000Z",
      lastActiveAt: "2026-02-12T10:00:00.000Z",
    },
  };

  const userData = mockUsers[slug || ""];

  if (!userData) {
    throw new Response("유저를 찾을 수 없습니다.", { status: 404 });
  }

  return { user: userData };
}

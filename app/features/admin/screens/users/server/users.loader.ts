/**
 * 유저 관리 테이블 행 데이터 타입
 */
export type AdminUserRow = {
  id: string;
  email: string;
  nickname: string;
  galleryAccess: boolean; // 포폴 접근 권한
  status: "active" | "suspended"; // 계정 상태
  createdAt: string; // ISO string - 가입일
  lastActiveAt: string; // ISO string - 최근 활동일
};

/**
 * 유저 목록 로더
 * 관리자 페이지에서 유저 목록을 가져옵니다.
 *
 * @returns 유저 목록 데이터
 */
export async function usersLoader(): Promise<{ rows: AdminUserRow[] }> {
  // TODO: Supabase에서 실제 데이터 가져오기
  // 현재는 mock 데이터 사용
  const rows: AdminUserRow[] = [
    {
      id: "user_001",
      email: "user1@example.com",
      nickname: "디자이너김",
      galleryAccess: true,
      status: "active",
      createdAt: "2025-11-15T08:00:00.000Z",
      lastActiveAt: "2026-02-10T14:30:00.000Z",
    },
    {
      id: "user_002",
      email: "user2@example.com",
      nickname: "프론트개발자",
      galleryAccess: false,
      status: "active",
      createdAt: "2025-12-01T10:15:00.000Z",
      lastActiveAt: "2026-02-11T09:20:00.000Z",
    },
    {
      id: "user_003",
      email: "user3@example.com",
      nickname: "백엔드마스터",
      galleryAccess: true,
      status: "suspended",
      createdAt: "2025-10-20T11:30:00.000Z",
      lastActiveAt: "2026-01-25T16:45:00.000Z",
    },
    {
      id: "user_004",
      email: "user4@example.com",
      nickname: "풀스택개발자",
      galleryAccess: false,
      status: "active",
      createdAt: "2026-01-10T09:00:00.000Z",
      lastActiveAt: "2026-02-12T10:00:00.000Z",
    },
  ];

  return { rows };
}

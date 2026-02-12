export type AdminClassRow = {
  id: string;
  title: string;
  status: "draft" | "published";
  category: string;
  likes: number;
  saves: number;
  isVisible: boolean;
  views: number;
  createdAt: string; // ISO string - 등록일
  updatedAt: string; // ISO string - 최근 수정일
};

export async function classesLoader() {
  const rows: AdminClassRow[] = [
    {
      id: "cls_001",
      title: "비전공자도 칭찬받는 폰트 위계 잡기",
      status: "published",
      category: "디자인",
      likes: 1200,
      saves: 3400,
      isVisible: true,
      views: 12430,
      createdAt: "2026-01-15T08:00:00.000Z",
      updatedAt: "2026-02-10T10:12:00.000Z",
    },
    {
      id: "cls_002",
      title: "컴포넌트 설계: 재사용 가능한 UI 구조",
      status: "draft",
      category: "프론트엔드",
      likes: 56,
      saves: 12,
      isVisible: false,
      views: 812,
      createdAt: "2026-02-01T14:20:00.000Z",
      updatedAt: "2026-02-11T09:30:00.000Z",
    },
    {
      id: "cls_003",
      title: "Tailwind로 디자인 시스템 유지하는 법",
      status: "published",
      category: "프론트엔드",
      likes: 320,
      saves: 800,
      isVisible: true,
      views: 4211,
      createdAt: "2026-01-20T11:30:00.000Z",
      updatedAt: "2026-02-09T02:00:00.000Z",
    },
    {
      id: "cls_004",
      title: "React Query로 서버 상태 관리하기",
      status: "published",
      category: "프론트엔드",
      likes: 12500,
      saves: 8900,
      isVisible: true,
      views: 45000,
      createdAt: "2025-12-10T09:15:00.000Z",
      updatedAt: "2026-02-08T16:45:00.000Z",
    },
  ];

  return { rows };
}

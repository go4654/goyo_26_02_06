/**
 * 갤러리 관리 테이블 행 데이터 타입
 */
export type AdminGalleryRow = {
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

/**
 * 갤러리 목록 로더
 * 관리자 페이지에서 갤러리 목록을 가져옵니다.
 *
 * @returns 갤러리 목록 데이터
 */
export async function galleriesLoader() {
  // TODO: Supabase에서 실제 데이터 가져오기
  // 현재는 mock 데이터 사용
  const rows: AdminGalleryRow[] = [
    {
      id: "gal_001",
      title: "포트폴리오 웹사이트 디자인",
      status: "published",
      category: "디자인",
      likes: 850,
      saves: 2100,
      isVisible: true,
      views: 5670,
      createdAt: "2026-01-10T09:00:00.000Z",
      updatedAt: "2026-02-08T14:30:00.000Z",
    },
    {
      id: "gal_002",
      title: "모바일 앱 UI/UX 디자인",
      status: "published",
      category: "디자인",
      likes: 1200,
      saves: 3200,
      isVisible: true,
      views: 8900,
      createdAt: "2026-01-20T11:15:00.000Z",
      updatedAt: "2026-02-05T16:20:00.000Z",
    },
    {
      id: "gal_003",
      title: "React 컴포넌트 라이브러리",
      status: "draft",
      category: "프론트엔드",
      likes: 45,
      saves: 120,
      isVisible: false,
      views: 234,
      createdAt: "2026-02-05T10:00:00.000Z",
      updatedAt: "2026-02-10T09:45:00.000Z",
    },
    {
      id: "gal_004",
      title: "브랜드 아이덴티티 디자인",
      status: "published",
      category: "디자인",
      likes: 2100,
      saves: 4500,
      isVisible: true,
      views: 12300,
      createdAt: "2025-12-15T08:30:00.000Z",
      updatedAt: "2026-02-01T13:15:00.000Z",
    },
  ];

  return { rows };
}

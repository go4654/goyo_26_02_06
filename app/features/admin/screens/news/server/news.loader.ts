/**
 * 뉴스 관리 테이블 행 데이터 타입
 */
export type AdminNewsRow = {
  id: string;
  title: string;
  status: "draft" | "published";
  category: string;
  isVisible: boolean;
  views: number;
  createdAt: string; // ISO string - 등록일
  updatedAt: string; // ISO string - 최근 수정일
};

/**
 * 뉴스 목록 로더
 * 관리자 페이지에서 뉴스 목록을 가져옵니다.
 *
 * @returns 뉴스 목록 데이터
 */
export async function newsLoader() {
  // TODO: Supabase에서 실제 데이터 가져오기
  // 현재는 mock 데이터 사용
  const rows: AdminNewsRow[] = [
    {
      id: "news_001",
      title: "2026년 웹 개발 트렌드 예측",
      status: "published",
      category: "기술",
      isVisible: true,
      views: 3450,
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-02-10T15:30:00.000Z",
    },
    {
      id: "news_002",
      title: "React 19 새로운 기능 소개",
      status: "published",
      category: "기술",
      isVisible: true,
      views: 5670,
      createdAt: "2026-01-25T09:15:00.000Z",
      updatedAt: "2026-02-08T11:20:00.000Z",
    },
    {
      id: "news_003",
      title: "디자인 시스템 구축 가이드",
      status: "draft",
      category: "디자인",
      isVisible: false,
      views: 123,
      createdAt: "2026-02-05T14:00:00.000Z",
      updatedAt: "2026-02-11T10:45:00.000Z",
    },
    {
      id: "news_004",
      title: "프론트엔드 성능 최적화 전략",
      status: "published",
      category: "기술",
      isVisible: true,
      views: 8900,
      createdAt: "2025-12-20T08:30:00.000Z",
      updatedAt: "2026-02-01T16:15:00.000Z",
    },
  ];

  return { rows };
}

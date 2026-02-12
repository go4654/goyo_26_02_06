import type { Route } from "../+types/admin-news-edit";

/**
 * 뉴스 상세 정보 타입
 * 수정 페이지에서 사용하는 전체 뉴스 데이터
 */
export type AdminNewsDetail = {
  id: string;
  title: string;
  description: string;
  tags: string[]; // 태그 배열
  content: string; // MDX 코드
  isVisible: boolean;
  status: "draft" | "published";
  category: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * 뉴스 상세 정보 로더
 * slug를 기반으로 뉴스 데이터를 가져옵니다.
 *
 * @param params - 라우트 파라미터 (slug 포함)
 * @returns 뉴스 상세 정보
 */
export async function newsDetailLoader({
  params,
}: Route.LoaderArgs): Promise<{ news: AdminNewsDetail }> {
  const { slug } = params;

  // TODO: Supabase에서 실제 데이터 가져오기
  // 현재는 mock 데이터 사용
  const mockNews: Record<string, AdminNewsDetail> = {
    news_001: {
      id: "news_001",
      title: "2026년 웹 개발 트렌드 예측",
      description:
        "2026년 웹 개발 분야에서 주목할 만한 트렌드와 기술을 살펴봅니다.",
      tags: ["technology", "web"],
      content: `# 2026년 웹 개발 트렌드 예측

2026년 웹 개발 분야의 주요 트렌드를 분석합니다.

## 주요 트렌드

1. AI 통합
2. 성능 최적화
3. 모바일 우선 설계`,
      isVisible: true,
      status: "published",
      category: "기술",
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-02-10T15:30:00.000Z",
    },
    news_002: {
      id: "news_002",
      title: "React 19 새로운 기능 소개",
      description: "React 19에서 추가된 새로운 기능들을 소개합니다.",
      tags: ["react", "frontend"],
      content: `# React 19 새로운 기능 소개

React 19의 새로운 기능에 대해 알아봅니다.`,
      isVisible: true,
      status: "published",
      category: "기술",
      createdAt: "2026-01-25T09:15:00.000Z",
      updatedAt: "2026-02-08T11:20:00.000Z",
    },
    news_003: {
      id: "news_003",
      title: "디자인 시스템 구축 가이드",
      description: "효율적인 디자인 시스템을 구축하는 방법을 안내합니다.",
      tags: ["design", "system"],
      content: `# 디자인 시스템 구축 가이드

디자인 시스템 구축에 대한 가이드입니다.`,
      isVisible: false,
      status: "draft",
      category: "디자인",
      createdAt: "2026-02-05T14:00:00.000Z",
      updatedAt: "2026-02-11T10:45:00.000Z",
    },
    news_004: {
      id: "news_004",
      title: "프론트엔드 성능 최적화 전략",
      description: "프론트엔드 애플리케이션의 성능을 최적화하는 전략을 소개합니다.",
      tags: ["frontend", "performance"],
      content: `# 프론트엔드 성능 최적화 전략

성능 최적화에 대한 전략을 알아봅니다.`,
      isVisible: true,
      status: "published",
      category: "기술",
      createdAt: "2025-12-20T08:30:00.000Z",
      updatedAt: "2026-02-01T16:15:00.000Z",
    },
  };

  const newsData = mockNews[slug || ""];

  if (!newsData) {
    throw new Response("뉴스를 찾을 수 없습니다.", { status: 404 });
  }

  return { news: newsData };
}

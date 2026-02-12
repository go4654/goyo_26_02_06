import type { Route } from "../+types/admin-gallery-edit";

/**
 * 갤러리 상세 정보 타입
 * 수정 페이지에서 사용하는 전체 갤러리 데이터
 */
export type AdminGalleryDetail = {
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
 * 갤러리 상세 정보 로더
 * slug를 기반으로 갤러리 데이터를 가져옵니다.
 *
 * @param params - 라우트 파라미터 (slug 포함)
 * @returns 갤러리 상세 정보
 */
export async function galleryDetailLoader({
  params,
}: Route.LoaderArgs): Promise<{ gallery: AdminGalleryDetail }> {
  const { slug } = params;

  // TODO: Supabase에서 실제 데이터 가져오기
  // 현재는 mock 데이터 사용
  const mockGalleries: Record<string, AdminGalleryDetail> = {
    gal_001: {
      id: "gal_001",
      title: "포트폴리오 웹사이트 디자인",
      description:
        "개인 포트폴리오 웹사이트를 위한 모던하고 세련된 디자인입니다.",
      tags: ["design", "portfolio"],
      content: `# 포트폴리오 웹사이트 디자인

포트폴리오 웹사이트 디자인에 대한 설명입니다.

## 디자인 컨셉

모던하고 미니멀한 디자인을 추구했습니다.`,
      isVisible: true,
      status: "published",
      category: "디자인",
      createdAt: "2026-01-10T09:00:00.000Z",
      updatedAt: "2026-02-08T14:30:00.000Z",
    },
    gal_002: {
      id: "gal_002",
      title: "모바일 앱 UI/UX 디자인",
      description: "사용자 경험을 중시한 모바일 앱 디자인입니다.",
      tags: ["design", "uxui", "mobile"],
      content: `# 모바일 앱 UI/UX 디자인

모바일 앱 디자인에 대한 설명입니다.`,
      isVisible: true,
      status: "published",
      category: "디자인",
      createdAt: "2026-01-20T11:15:00.000Z",
      updatedAt: "2026-02-05T16:20:00.000Z",
    },
    gal_003: {
      id: "gal_003",
      title: "React 컴포넌트 라이브러리",
      description: "재사용 가능한 React 컴포넌트 모음입니다.",
      tags: ["frontend", "react"],
      content: `# React 컴포넌트 라이브러리

React 컴포넌트에 대한 설명입니다.`,
      isVisible: false,
      status: "draft",
      category: "프론트엔드",
      createdAt: "2026-02-05T10:00:00.000Z",
      updatedAt: "2026-02-10T09:45:00.000Z",
    },
    gal_004: {
      id: "gal_004",
      title: "브랜드 아이덴티티 디자인",
      description: "브랜드의 정체성을 표현하는 디자인입니다.",
      tags: ["design", "branding"],
      content: `# 브랜드 아이덴티티 디자인

브랜드 디자인에 대한 설명입니다.`,
      isVisible: true,
      status: "published",
      category: "디자인",
      createdAt: "2025-12-15T08:30:00.000Z",
      updatedAt: "2026-02-01T13:15:00.000Z",
    },
  };

  const galleryData = mockGalleries[slug || ""];

  if (!galleryData) {
    throw new Response("갤러리를 찾을 수 없습니다.", { status: 404 });
  }

  return { gallery: galleryData };
}

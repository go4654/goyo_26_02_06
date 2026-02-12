import type { Route } from "../+types/admin-classes-edit";

/**
 * 클래스 상세 정보 타입
 * 수정 페이지에서 사용하는 전체 클래스 데이터
 */
export type AdminClassDetail = {
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
 * 클래스 상세 정보 로더
 * slug를 기반으로 클래스 데이터를 가져옵니다.
 *
 * @param params - 라우트 파라미터 (slug 포함)
 * @returns 클래스 상세 정보
 */
export async function classDetailLoader({
  params,
}: Route.LoaderArgs): Promise<{ class: AdminClassDetail }> {
  const { slug } = params;

  // TODO: Supabase에서 실제 데이터 가져오기
  // 현재는 mock 데이터 사용
  const mockClasses: Record<string, AdminClassDetail> = {
    cls_001: {
      id: "cls_001",
      title: "비전공자도 칭찬받는 폰트 위계 잡기",
      description:
        "왜 내가 만든 디자인은 가독성이 떨어질까? 그 해답은 폰트의 크기가 아니라 '위계'에 있습니다.",
      tags: ["design", "uxui"],
      content: `# 폰트 위계의 중요성

폰트 위계는 디자인의 핵심입니다.

## 위계를 만드는 방법

1. 크기 차이
2. 굵기 차이
3. 색상 차이

이 세 가지를 조합하면 명확한 위계를 만들 수 있습니다.`,
      isVisible: true,
      status: "published",
      category: "디자인",
      createdAt: "2026-01-15T08:00:00.000Z",
      updatedAt: "2026-02-10T10:12:00.000Z",
    },
    cls_002: {
      id: "cls_002",
      title: "컴포넌트 설계: 재사용 가능한 UI 구조",
      description: "재사용 가능한 컴포넌트를 만드는 방법을 알아봅니다.",
      tags: ["frontend", "react"],
      content: `# 컴포넌트 설계

재사용 가능한 컴포넌트를 만드는 것은 중요합니다.`,
      isVisible: false,
      status: "draft",
      category: "프론트엔드",
      createdAt: "2026-02-01T14:20:00.000Z",
      updatedAt: "2026-02-11T09:30:00.000Z",
    },
    cls_003: {
      id: "cls_003",
      title: "Tailwind로 디자인 시스템 유지하는 법",
      description: "Tailwind CSS를 활용한 디자인 시스템 구축 방법",
      tags: ["frontend", "tailwind"],
      content: `# Tailwind 디자인 시스템

Tailwind를 활용한 디자인 시스템 구축 방법을 알아봅니다.`,
      isVisible: true,
      status: "published",
      category: "프론트엔드",
      createdAt: "2026-01-20T11:30:00.000Z",
      updatedAt: "2026-02-09T02:00:00.000Z",
    },
    cls_004: {
      id: "cls_004",
      title: "React Query로 서버 상태 관리하기",
      description: "React Query를 활용한 효율적인 서버 상태 관리",
      tags: ["frontend", "react", "react-query"],
      content: `# React Query

서버 상태를 효율적으로 관리하는 방법을 알아봅니다.`,
      isVisible: true,
      status: "published",
      category: "프론트엔드",
      createdAt: "2025-12-10T09:15:00.000Z",
      updatedAt: "2026-02-08T16:45:00.000Z",
    },
  };

  const classData = mockClasses[slug || ""];

  if (!classData) {
    throw new Response("클래스를 찾을 수 없습니다.", { status: 404 });
  }

  return { class: classData };
}

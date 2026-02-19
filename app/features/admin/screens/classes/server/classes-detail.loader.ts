import type { Route } from "../+types/admin-classes-edit";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * 클래스 상세 정보 타입
 * 수정 페이지에서 사용하는 전체 클래스 데이터
 */
export type AdminClassDetail = {
  id: string;
  title: string;
  description: string | null;
  tags: string[]; // 태그 배열 (태그 이름)
  content: string; // MDX 코드 (content_mdx)
  isVisible: boolean; // is_published
  category: string;
  thumbnail_image_url: string | null;
  cover_image_urls: string[];
  createdAt: string; // created_at
  updatedAt: string; // updated_at
};

/**
 * 클래스 상세 정보 로더
 * slug를 기반으로 클래스 데이터를 가져옵니다.
 *
 * @param params - 라우트 파라미터 (slug 포함)
 * @param request - 요청 객체
 * @returns 클래스 상세 정보
 */
export async function classDetailLoader({
  params,
  request,
}: Route.LoaderArgs): Promise<{ class: AdminClassDetail }> {
  const { slug } = params;

  if (!slug) {
    throw new Response("클래스를 찾을 수 없습니다.", { status: 404 });
  }

  const [client] = makeServerClient(request);

  // 관리자 권한 확인
  await requireAdmin(client);

  // 클래스 데이터 조회
  const { data: classData, error: classError } = await client
    .from("classes")
    .select(
      "id, title, description, category, slug, thumbnail_image_url, cover_image_urls, content_mdx, is_published, created_at, updated_at",
    )
    .eq("slug", slug)
    .eq("is_deleted", false)
    .single();

  if (classError || !classData) {
    throw new Response("클래스를 찾을 수 없습니다.", { status: 404 });
  }

  // 태그 조회 (class_tags와 tags 테이블 조인)
  const { data: tagsData, error: tagsError } = await client
    .from("class_tags")
    .select("tags(name)")
    .eq("class_id", classData.id as string);

  if (tagsError) {
    throw new Error(`태그 조회 실패: ${tagsError.message}`);
  }

  // 태그 이름 배열 추출
  const tags: string[] =
    tagsData
      ?.map((item) => {
        const tag = item.tags as { name: string } | null;
        return tag?.name;
      })
      .filter((name): name is string => typeof name === "string") || [];

  return {
    class: {
      id: classData.id as string,
      title: classData.title as string,
      description: (classData.description as string | null) || null,
      tags,
      content: classData.content_mdx as string,
      isVisible: classData.is_published as boolean,
      category: classData.category as string,
      thumbnail_image_url: (classData.thumbnail_image_url as string | null) || null,
      cover_image_urls: (classData.cover_image_urls as string[]) || [],
      createdAt: classData.created_at as string,
      updatedAt: classData.updated_at as string,
    },
  };
}

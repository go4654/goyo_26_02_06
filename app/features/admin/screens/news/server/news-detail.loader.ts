import type { Route } from "../+types/admin-news-edit";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * 뉴스 수정 페이지용 상세 타입 (slug 수정 불가, 태그 없음)
 */
export type AdminNewsDetail = {
  id: string;
  slug: string;
  title: string;
  category: string;
  content: string;
  content_mdx: string;
  thumbnail_image_url: string | null;
  cover_image_urls: string[];
  visibility: string;
  is_published: boolean;
  isVisible: boolean;
};

/**
 * 뉴스 상세 로더
 * slug로 뉴스 조회, 관리자 권한 확인, 없으면 404
 */
export async function newsDetailLoader({
  params,
  request,
}: Route.LoaderArgs): Promise<{ news: AdminNewsDetail }> {
  const { slug } = params;

  if (!slug) {
    throw new Response("뉴스를 찾을 수 없습니다.", { status: 404 });
  }

  const [client] = makeServerClient(request);
  await requireAdmin(client);

  const { data: row, error } = await client
    .from("news")
    .select(
      "id, slug, title, category, content_mdx, thumbnail_image_url, cover_image_urls, visibility, is_published",
    )
    .eq("slug", slug)
    .single();

  if (error || !row) {
    throw new Response("뉴스를 찾을 수 없습니다.", { status: 404 });
  }

  const cover_image_urls = (row.cover_image_urls as string[]) ?? [];

  return {
    news: {
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      category: row.category as string,
      content: row.content_mdx as string,
      content_mdx: row.content_mdx as string,
      thumbnail_image_url: (row.thumbnail_image_url as string | null) ?? null,
      cover_image_urls,
      visibility: (row.visibility as string) ?? "public",
      is_published: row.is_published as boolean,
      isVisible: row.is_published as boolean,
    },
  };
}

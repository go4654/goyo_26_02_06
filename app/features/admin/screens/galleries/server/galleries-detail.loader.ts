import type { Route } from "../+types/admin-gallery-edit";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * 갤러리 수정 페이지용 상세 타입
 * AdminContentForm의 ContentFormData와 맞춤
 */
export type AdminGalleryDetail = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  content: string;
  isVisible: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
};

interface GalleryRow {
  id: string;
  title: string;
  description: string | null;
  caption: string | null;
  category: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  gallery_tags?: Array<{ tags: { name: string } | null }>;
}

/**
 * 갤러리 수정 페이지 로더
 * slug로 갤러리 조회 (관리자용, is_published 무관)
 */
export async function galleryDetailLoader({
  params,
  request,
}: Route.LoaderArgs): Promise<{ gallery: AdminGalleryDetail }> {
  const { slug } = params;

  if (!slug) {
    throw new Response("갤러리를 찾을 수 없습니다.", { status: 404 });
  }

  const [client] = makeServerClient(request);
  await requireAdmin(client);

  const { data: row, error } = await client
    .from("galleries")
    .select(
      "id, title, description, caption, category, is_published, created_at, updated_at, gallery_tags(tags(name))",
    )
    .eq("slug", slug)
    .single();

  if (error || !row) {
    if (error?.code === "PGRST116") {
      throw new Response("갤러리를 찾을 수 없습니다.", { status: 404 });
    }
    throw new Error(`갤러리 조회 실패: ${error?.message ?? "unknown"}`);
  }

  const r = row as unknown as GalleryRow;
  const tags: string[] = (r.gallery_tags ?? [])
    .map((gt) => gt.tags?.name)
    .filter((name): name is string => typeof name === "string");

  const gallery: AdminGalleryDetail = {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    tags,
    content: r.caption ?? r.description ?? "",
    isVisible: r.is_published,
    category: r.category,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };

  return { gallery };
}

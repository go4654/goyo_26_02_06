import type { Route } from "../+types/admin-news-edit";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  updateNewsService,
  type ExistingNewsRow,
} from "../../../services/news-update.service";
import {
  NEWS_CATEGORIES,
  type NewsCategory,
} from "~/features/news/constants/news-categories";

export type NewsUpdateActionResponse =
  | { success: true; slug: string }
  | { error: string };

/**
 * 뉴스 수정 액션
 * requireAdmin, slug로 기존 뉴스 조회 후 updateNewsService 호출. slug 수정 금지.
 */
export async function newsUpdateAction({
  request,
  params,
}: Route.ActionArgs): Promise<ReturnType<typeof data>> {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  const slug = params.slug;
  if (!slug) {
    return data({ error: "뉴스를 찾을 수 없습니다." }, { status: 404 });
  }

  if (request.method !== "POST") {
    return data({ error: "잘못된 요청 메서드입니다." }, { status: 405 });
  }

  const { data: row, error: fetchError } = await client
    .from("news")
    .select("id, content_mdx, thumbnail_image_url, cover_image_urls")
    .eq("slug", slug)
    .single();

  if (fetchError || !row) {
    return data({ error: "뉴스를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const formData = await request.formData();

    const title = (formData.get("title") as string | null)?.trim();
    const categoryRaw =
      (formData.get("category") as string | null)?.trim() || "notice";
    const category: NewsCategory = NEWS_CATEGORIES.includes(
      categoryRaw as NewsCategory,
    )
      ? (categoryRaw as NewsCategory)
      : "notice";
    const content = (formData.get("content") as string | null)?.trim();
    const isPublished = formData.get("isPublished") === "true";
    const visibilityRaw =
      (formData.get("visibility") as string | null)?.trim() || "public";
    const visibility =
      visibilityRaw === "member" ? ("member" as const) : ("public" as const);
    const thumbnailFile = formData.get("thumbnail") as File | null;
    const coverFile = formData.get("cover") as File | null;

    const contentImageFiles: File[] = [];
    const contentImageTempIds: string[] = [];
    formData.getAll("contentImages").forEach((file) => {
      if (file instanceof File) contentImageFiles.push(file);
    });
    formData.getAll("contentImageTempIds").forEach((tempId) => {
      if (typeof tempId === "string") contentImageTempIds.push(tempId);
    });

    if (!title) {
      return data({ error: "타이틀을 입력해주세요." }, { status: 400 });
    }

    if (!content) {
      return data({ error: "콘텐츠를 입력해주세요." }, { status: 400 });
    }

    const existing: ExistingNewsRow = {
      id: row.id as string,
      content_mdx: (row.content_mdx as string) ?? "",
      thumbnail_image_url:
        (row.thumbnail_image_url as string | null) ?? null,
      cover_image_urls: (row.cover_image_urls as string[]) ?? [],
    };

    await updateNewsService(client, existing, {
      title,
      category,
      content,
      visibility,
      isPublished,
      thumbnailFile:
        thumbnailFile && thumbnailFile.size > 0 ? thumbnailFile : null,
      coverFile: coverFile && coverFile.size > 0 ? coverFile : null,
      contentImageFiles,
      contentImageTempIds,
    });

    return data({ success: true, slug }, { status: 200 });
  } catch (err) {
    return data(
      {
        error:
          err instanceof Error
            ? err.message
            : "뉴스 수정 중 알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

/**
 * 뉴스 생성 액션
 * POST만 허용. FormData: title, category, content, isPublished, thumbnail, cover, contentImages, contentImageTempIds.
 */
import type { Route } from "../+types/admin-news-new";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { createNews } from "../../../services/news-create.service";
import {
  NEWS_CATEGORIES,
  type NewsCategory,
} from "~/features/news/constants/news-categories";

export type NewsCreateActionResponse =
  | { success: true; newsId: string }
  | { error: string };

export async function newsCreateAction({
  request,
}: Route.ActionArgs): Promise<ReturnType<typeof data>> {
  const [client] = makeServerClient(request);
  const user = await requireAdmin(client);

  if (request.method !== "POST") {
    return data({ error: "잘못된 요청 메서드입니다." }, { status: 405 });
  }

  try {
    const formData = await request.formData();

    const title = (formData.get("title") as string | null)?.trim();
    const categoryRaw = (formData.get("category") as string | null)?.trim() || "notice";
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

    const newsId = await createNews(client, {
      title,
      category,
      contentMdx: content,
      isPublished,
      visibility,
      authorId: user.id,
      thumbnailFile:
        thumbnailFile && thumbnailFile.size > 0 ? thumbnailFile : null,
      coverFile: coverFile && coverFile.size > 0 ? coverFile : null,
      contentImageFiles,
      contentImageTempIds,
    });

    return data({ success: true, newsId }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "뉴스 등록 중 알 수 없는 오류가 발생했습니다.";
    return data({ error: message }, { status: 500 });
  }
}

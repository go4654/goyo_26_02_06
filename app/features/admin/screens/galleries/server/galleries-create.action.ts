/**
 * 갤러리 생성 액션
 * POST 시 createGallery 서비스를 호출합니다.
 */
import type { Route } from "../+types/admin-gallery-new";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { createGallery } from "../../../services/gallery-create.service";
import { isGalleryCategory } from "~/features/gallery/constants";

export type GalleryCreateActionResponse =
  | { success: true; galleryId: string }
  | { error: string };

export async function galleriesCreateAction({
  request,
}: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  const user = await requireAdmin(client);

  if (request.method !== "POST") {
    return data({ error: "잘못된 요청 메서드입니다." }, { status: 405 });
  }

  try {
    const formData = await request.formData();

    const title = (formData.get("title") as string | null)?.trim();
    const subtitle = (formData.get("subtitle") as string | null)?.trim() || null;
    const description = (formData.get("description") as string | null)?.trim() || null;
    const caption = (formData.get("caption") as string | null)?.trim() || null;
    const categoryRaw = (formData.get("category") as string | null) || "design";
    const category = isGalleryCategory(categoryRaw) ? categoryRaw : "design";
    const tags = (formData.get("tags") as string | null) || "";
    const isPublished = formData.get("isPublished") === "true";
    const thumbnailFile = formData.get("thumbnail") as File | null;

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

    if (!description) {
      return data({ error: "본문(설명)을 입력해주세요." }, { status: 400 });
    }

    const galleryId = await createGallery(client, {
      title,
      subtitle,
      description,
      caption,
      category,
      isPublished,
      authorId: user.id,
      thumbnailFile: thumbnailFile && thumbnailFile.size > 0 ? thumbnailFile : null,
      contentImageFiles,
      contentImageTempIds,
      tagString: tags,
    });

    return data({ success: true, galleryId }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "갤러리 생성 중 알 수 없는 오류가 발생했습니다.";
    return data({ error: message }, { status: 500 });
  }
}

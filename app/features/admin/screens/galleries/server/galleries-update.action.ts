/**
 * 갤러리 수정 액션
 * slug로 갤러리 조회 후 updateGalleryService 호출 (썸네일·MDX·image_urls·태그·DB 원자적 처리)
 */
import type { Route } from "../+types/admin-gallery-edit";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { updateGalleryService } from "../../../services/gallery-update.service";
import { isGalleryCategory } from "~/features/gallery/constants";

export type GalleryUpdateActionResponse =
  | { success: true; slug: string }
  | { error: string };

export async function galleriesUpdateAction({
  request,
  params,
}: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  const slug = params.slug;
  if (!slug) {
    return data({ error: "갤러리를 찾을 수 없습니다." }, { status: 404 });
  }

  if (request.method !== "POST") {
    return data({ error: "잘못된 요청 메서드입니다." }, { status: 405 });
  }

  try {
    const { data: galleryRow, error: galleryError } = await client
      .from("galleries")
      .select(
        "id, description, caption, thumbnail_image_url, image_urls",
      )
      .eq("slug", slug)
      .single();

    if (galleryError || !galleryRow) {
      return data({ error: "갤러리를 찾을 수 없습니다." }, { status: 404 });
    }

    const formData = await request.formData();
    const title = (formData.get("title") as string | null)?.trim();
    const subtitle = (formData.get("subtitle") as string | null)?.trim() || null;
    const description =
      (formData.get("description") as string | null)?.trim() || null;
    const caption =
      (formData.get("caption") as string | null)?.trim() || null;
    const categoryRaw = (formData.get("category") as string | null) || "design";
    const category = isGalleryCategory(categoryRaw) ? categoryRaw : "design";
    const tagString = (formData.get("tags") as string | null) ?? "";
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

    const keptImageUrls: string[] = [];
    formData.getAll("keptImageUrls").forEach((url) => {
      if (typeof url === "string" && url.trim()) keptImageUrls.push(url.trim());
    });

    const galleryImageFiles: File[] = [];
    formData.getAll("galleryImages").forEach((file) => {
      if (file instanceof File && file.size > 0) galleryImageFiles.push(file);
    });

    if (!title) {
      return data({ error: "타이틀을 입력해주세요." }, { status: 400 });
    }

    if (!description) {
      return data({ error: "본문(설명)을 입력해주세요." }, { status: 400 });
    }

    await updateGalleryService(
      client,
      {
        id: galleryRow.id as string,
        description: (galleryRow.description as string | null) ?? null,
        caption: (galleryRow.caption as string | null) ?? null,
        thumbnail_image_url:
          (galleryRow.thumbnail_image_url as string | null) ?? null,
        image_urls: (galleryRow.image_urls as string[]) ?? [],
      },
      {
        title,
        subtitle,
        description,
        caption,
        category,
        isPublished,
        tagString,
        thumbnailFile:
          thumbnailFile && thumbnailFile.size > 0 ? thumbnailFile : null,
        contentImageFiles,
        contentImageTempIds,
        keptImageUrls,
        galleryImageFiles,
      },
    );

    return data({ success: true, slug }, { status: 200 });
  } catch (error) {
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "갤러리 수정 중 알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

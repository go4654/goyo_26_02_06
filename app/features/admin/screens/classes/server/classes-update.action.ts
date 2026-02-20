import type { Route } from "../+types/admin-classes-edit";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { updateClassService } from "~/features/admin/services/class-update.service";

/**
 * 클래스 수정 액션
 * - 관리자 권한 검증 후 slug로 클래스 조회
 * - FormData 파싱 후 updateClassService 호출 (썸네일·MDX 이미지·태그·DB 원자적 처리)
 */
export async function classesUpdateAction({
  request,
  params,
}: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  const slug = params.slug;
  if (!slug) {
    return data({ error: "클래스를 찾을 수 없습니다." }, { status: 404 });
  }

  if (request.method !== "POST") {
    return data({ error: "잘못된 요청 메서드입니다." }, { status: 405 });
  }

  try {
    const { data: classRow, error: classError } = await client
      .from("classes")
      .select("id, content_mdx, thumbnail_image_url")
      .eq("slug", slug)
      .eq("is_deleted", false)
      .single();

    if (classError || !classRow) {
      return data({ error: "클래스를 찾을 수 없습니다." }, { status: 404 });
    }

    const formData = await request.formData();
    const title = (formData.get("title") as string | null)?.trim();
    const description = (formData.get("description") as string | null)?.trim() ?? null;
    const content = (formData.get("content") as string | null)?.trim();
    const tagString = (formData.get("tags") as string | null) ?? "";
    const isPublished = formData.get("isPublished") === "true";
    const category = (formData.get("category") as string | null) || "design";
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

    if (!content) {
      return data({ error: "콘텐츠를 입력해주세요." }, { status: 400 });
    }

    await updateClassService(
      client,
      {
        id: classRow.id as string,
        content_mdx: (classRow.content_mdx as string) ?? "",
        thumbnail_image_url: (classRow.thumbnail_image_url as string | null) ?? null,
      },
      {
        title,
        description: description || null,
        category,
        content,
        isPublished,
        tagString,
        thumbnailFile: thumbnailFile && thumbnailFile.size > 0 ? thumbnailFile : null,
        contentImageFiles,
        contentImageTempIds,
      },
    );

    return data({ success: true, slug }, { status: 200 });
  } catch (error) {
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "클래스 수정 중 알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

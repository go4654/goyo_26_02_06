import type { Route } from "../+types/admin-classes-new";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  createClassBase,
  generateUniqueSlug,
  processTags,
  processTempImages,
  updateClassContent,
  uploadThumbnail,
} from "../../../services/class-create.service";

/**
 * 클래스 생성 액션
 */
export async function classesAction({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  const user = await requireAdmin(client);

  if (request.method !== "POST") {
    return data({ error: "잘못된 요청 메서드입니다." }, { status: 405 });
  }

  try {
    const formData = await request.formData();

    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const tags = formData.get("tags") as string | null;
    const content = formData.get("content") as string | null;
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

    if (!title?.trim()) {
      return data({ error: "타이틀을 입력해주세요." }, { status: 400 });
    }

    if (!content?.trim()) {
      return data({ error: "콘텐츠를 입력해주세요." }, { status: 400 });
    }

    const slug = await generateUniqueSlug(client, title);

    const classId = await createClassBase(client, {
      title: title.trim(),
      description: description?.trim() || null,
      category,
      content: content.trim(),
      isPublished,
      authorId: user.id,
      slug,
    });

    if (thumbnailFile && thumbnailFile.size > 0) {
      await uploadThumbnail(client, classId, thumbnailFile);
    }

    if (contentImageFiles.length > 0) {
      const updatedContent = await processTempImages(
        client,
        classId,
        content,
        contentImageFiles,
        contentImageTempIds,
      );

      if (updatedContent !== content) {
        await updateClassContent(client, classId, updatedContent);
      }
    }

    if (tags) {
      await processTags(client, classId, tags);
    }

    return data({ success: true, classId, slug }, { status: 201 });
  } catch (error) {
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "클래스 생성 중 알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

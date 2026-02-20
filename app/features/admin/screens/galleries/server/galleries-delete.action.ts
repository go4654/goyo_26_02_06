import type { Route } from "../+types/galleries";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { deleteGalleries } from "../../../services/gallery-delete.service";

/**
 * 갤러리 일괄 삭제 액션 (Hard delete, Storage 실패 시 DB 삭제 중단)
 */
export async function galleriesDeleteAction({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  if (request.method !== "DELETE") {
    return data({ error: "잘못된 요청 메서드입니다." }, { status: 405 });
  }

  try {
    const body = await request.json();
    const galleryIds = body.galleryIds as string[] | undefined;

    if (!galleryIds || !Array.isArray(galleryIds) || galleryIds.length === 0) {
      return data(
        { error: "삭제할 갤러리 ID가 필요합니다." },
        { status: 400 },
      );
    }

    const results = await deleteGalleries(client, galleryIds);

    const deletedCount = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    return data(
      {
        success: true,
        deletedCount,
        failed,
      },
      { status: 200 },
    );
  } catch (error) {
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "갤러리 삭제 중 알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

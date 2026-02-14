import type { Route } from "../screens/+types/gallery";

import { data } from "react-router";

import { getUserRole, requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { toggleGalleryLike, toggleGallerySave } from "../mutation";

/**
 * 갤러리 액션 타입 (클래스 액션과 동일한 명명 규칙)
 */
type GalleryAction = "toggleLike" | "toggleSave";

export async function galleryAction({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const { user } = await getUserRole(client);
  if (!user) {
    return data({ error: "인증이 필요합니다." }, { status: 401, headers });
  }

  const formData = await request.formData();
  const action = formData.get("action") as GalleryAction;
  const galleryId = formData.get("galleryId") as string;

  try {
    switch (action) {
      case "toggleLike": {
        if (!galleryId) {
          return data(
            { error: "갤러리 ID가 필요합니다." },
            { status: 400, headers },
          );
        }

        const isLiked = await toggleGalleryLike(client, galleryId, user.id);

        // 업데이트된 좋아요 카운트 조회 (트리거/denormalized 컬럼에 의존하지 않고 실제 레코드 수로 계산)
        const { count: likeCount, error: likeCountError } = await client
          .from("gallery_likes")
          .select("id", { count: "exact", head: true })
          .eq("gallery_id", galleryId);
        if (likeCountError) throw likeCountError;

        return data(
          { success: true, isLiked, likeCount: likeCount ?? 0 },
          { status: 200, headers },
        );
      }

      case "toggleSave": {
        if (!galleryId) {
          return data(
            { error: "갤러리 ID가 필요합니다." },
            { status: 400, headers },
          );
        }

        const isSaved = await toggleGallerySave(client, galleryId, user.id);

        const { count: saveCount, error: saveCountError } = await client
          .from("gallery_saves")
          .select("id", { count: "exact", head: true })
          .eq("gallery_id", galleryId);
        if (saveCountError) throw saveCountError;

        return data(
          { success: true, isSaved, saveCount: saveCount ?? 0 },
          { status: 200, headers },
        );
      }

      default:
        return data({ error: "지원하지 않는 액션입니다." }, { status: 400, headers });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return data({ error: errorMessage }, { status: 500, headers });
  }
}

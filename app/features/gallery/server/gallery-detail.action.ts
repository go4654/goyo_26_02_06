import type { Route } from "../screens/+types/gallery-detail";

import { data } from "react-router";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { toggleGalleryLike, toggleGallerySave } from "../mutation";

type GalleryDetailAction = "toggleLike" | "toggleSave";

/**
 * 갤러리 상세 액션: 좋아요/저장 토글
 *
 * - POST formData: action('toggleLike'|'toggleSave') + galleryId
 * - 목록(/gallery) 액션과 동일한 규칙으로 처리하여 유지보수성을 높입니다.
 */
export async function galleryDetailAction({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  if (request.method !== "POST") {
    return data(null, { status: 405, headers });
  }

  const formData = await request.formData();
  const action = formData.get("action") as GalleryDetailAction | null;
  const galleryId = formData.get("galleryId") as string | null;

  const {
    data: { user },
  } = await client.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    return data({ success: false, error: "로그인이 필요합니다." }, { status: 401, headers });
  }

  // 과거 payload(intent)를 보내던 코드 호환: intent -> action 매핑
  const intent = formData.get("intent") as string | null;
  const normalizedAction =
    action ??
    (intent === "like"
      ? "toggleLike"
      : intent === "save"
        ? "toggleSave"
        : null);

  if (!galleryId || !normalizedAction) {
    return data({ success: false, error: "잘못된 요청입니다." }, { status: 400, headers });
  }

  try {
    if (normalizedAction === "toggleLike") {
      const isLiked = await toggleGalleryLike(client, galleryId, userId);
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

    const isSaved = await toggleGallerySave(client, galleryId, userId);
    const { count: saveCount, error: saveCountError } = await client
      .from("gallery_saves")
      .select("id", { count: "exact", head: true })
      .eq("gallery_id", galleryId);
    if (saveCountError) throw saveCountError;

    return data(
      { success: true, isSaved, saveCount: saveCount ?? 0 },
      { status: 200, headers },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return data({ success: false, error: errorMessage }, { status: 500, headers });
  }
}

import type { Route } from "../screens/+types/gallery-detail";

import { data } from "react-router";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  getAdjacentGallerySlugs,
  getGalleryBySlug,
  getGalleryUserActions,
} from "../queries";

/**
 * 갤러리 상세 페이지 로더
 *
 * - 인증 및 갤러리 접근 권한은 requireAuthentication에서 처리
 * - slug로 갤러리 상세 조회, 없으면 404
 * - 현재 유저의 좋아요/저장 여부 및 이전·다음 슬러그 함께 반환
 */
export async function galleryDetailLoader({
  request,
  params,
}: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const slug = params.slug;
  if (!slug) {
    throw new Response("갤러리를 찾을 수 없습니다.", { status: 404 });
  }

  const gallery = await getGalleryBySlug(client, slug);
  if (!gallery) {
    throw new Response("갤러리를 찾을 수 없습니다.", { status: 404 });
  }

  const {
    data: { user },
  } = await client.auth.getUser();
  const userId = user?.id ?? null;

  const [countsResult, userActions, adjacent] = await Promise.all([
    // 좋아요/저장 카운트는 denormalized 컬럼에만 의존하지 않고 실제 레코드 수로 계산
    Promise.all([
      client
        .from("gallery_likes")
        .select("id", { count: "exact", head: true })
        .eq("gallery_id", gallery.id)
        .then((r) => ({ count: r.count ?? 0, error: r.error })),
      client
        .from("gallery_saves")
        .select("id", { count: "exact", head: true })
        .eq("gallery_id", gallery.id)
        .then((r) => ({ count: r.count ?? 0, error: r.error })),
    ]).catch((error) => {
      console.error("갤러리 좋아요/저장 카운트 계산 실패:", error);
      return [{ count: 0, error: null }, { count: 0, error: null }];
    }),
    userId
      ? getGalleryUserActions(client, gallery.id, userId)
      : Promise.resolve({ liked: false, saved: false }),
    getAdjacentGallerySlugs(client, gallery.slug, gallery.created_at),
  ]);

  const [likeCountResult, saveCountResult] = countsResult;

  const galleryWithCounts = {
    ...gallery,
    like_count: likeCountResult.count,
    save_count: saveCountResult.count,
  };

  // 세션 갱신을 위한 Set-Cookie 헤더를 반드시 응답에 포함
  return data(
    {
      gallery: galleryWithCounts,
      hasLiked: userActions.liked,
      hasSaved: userActions.saved,
      adjacent,
    },
    { headers },
  );
}

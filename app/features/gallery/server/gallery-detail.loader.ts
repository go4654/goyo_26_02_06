import type { Route } from "../screens/+types/gallery-detail";

import { bundleMDX } from "mdx-bundler";
import { data } from "react-router";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { logger } from "~/core/utils/logger";

import {
  getAdjacentGallerySlugs,
  getGalleryBySlug,
  getGalleryUserActions,
  incrementGalleryView,
} from "../queries";

/** MDX 문자열이 있으면 번들 후 code 반환, 없으면 null */
async function bundleMdxIfPresent(source: string | null): Promise<string | null> {
  if (!source?.trim()) return null;
  const { code } = await bundleMDX({ source: source.trim() });
  return code;
}

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
      logger.error("갤러리 좋아요/저장 카운트 계산 실패:", error);
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

  // 조회 이벤트 기록 (트리거로 galleries.view_count 자동 증가). 실패해도 페이지는 노출
  incrementGalleryView(client, gallery.id, userId).catch((err) => {
    logger.error("갤러리 조회수 증가 실패:", err);
  });

  // description / caption이 MDX로 저장된 경우 번들링
  const [descriptionCode, captionCode] = await Promise.all([
    bundleMdxIfPresent(gallery.description),
    bundleMdxIfPresent(gallery.caption),
  ]);

  return data(
    {
      gallery: galleryWithCounts,
      hasLiked: userActions.liked,
      hasSaved: userActions.saved,
      adjacent,
      descriptionCode,
      captionCode,
    },
    { headers },
  );
}

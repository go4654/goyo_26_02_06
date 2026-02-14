import type { Route } from "./+types/gallery-detail";

import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import Tags from "~/core/components/tags";
import { Separator } from "~/core/components/ui/separator";

import FloatingActionBar from "../components/floating-action-bar";
import GalleryLikeSaveButtons from "../components/gallery-like-save-buttons";
import { galleryDetailAction } from "../server/gallery-detail.action";
import { galleryDetailLoader } from "../server/gallery-detail.loader";

export const meta: Route.MetaFunction = ({ params }: { params: { slug?: string } }) => {
  return [{ title: `갤러리 · ${params.slug ?? "상세"}` }];
};

export const loader = galleryDetailLoader;
export const action = galleryDetailAction;

/**
 * 대표 이미지 URL 결정: thumbnail > image_urls[0], 없으면 null
 */
function getMainImageUrl(
  thumbnail: string | null,
  imageUrls: string[],
): string | null {
  if (thumbnail?.trim()) return thumbnail;
  const first = imageUrls?.[0];
  return first?.trim() ? first : null;
}

export default function GalleryDetail({
  loaderData,
}: Route.ComponentProps) {
  const { gallery, adjacent } = loaderData;

  const likeFetcher = useFetcher();
  const saveFetcher = useFetcher();

  const [isLiked, setIsLiked] = useState<boolean>(loaderData.hasLiked);
  const [isSaved, setIsSaved] = useState<boolean>(loaderData.hasSaved);
  const [likeCount, setLikeCount] = useState<number>(gallery.like_count);
  const [saveCount, setSaveCount] = useState<number>(gallery.save_count);

  const prevLikeState = useRef(likeFetcher.state);
  const prevSaveState = useRef(saveFetcher.state);

  // 로더 데이터 변경 시 상태 동기화
  useEffect(() => {
    setIsLiked(loaderData.hasLiked);
  }, [loaderData.hasLiked]);

  useEffect(() => {
    setIsSaved(loaderData.hasSaved);
  }, [loaderData.hasSaved]);

  useEffect(() => {
    setLikeCount(gallery.like_count);
  }, [gallery.like_count]);

  useEffect(() => {
    setSaveCount(gallery.save_count);
  }, [gallery.save_count]);

  // 좋아요 액션 결과 처리 (class-detail과 동일 패턴)
  useEffect(() => {
    const prev = prevLikeState.current;
    prevLikeState.current = likeFetcher.state;

    const justFinished =
      (prev === "submitting" || prev === "loading") &&
      likeFetcher.state === "idle";
    if (!justFinished) return;

    const result = likeFetcher.data as
      | { success?: boolean; isLiked?: boolean; likeCount?: number }
      | undefined;
    if (!result?.success) return;

    if (typeof result.isLiked === "boolean") setIsLiked(result.isLiked);
    if (typeof result.likeCount === "number") setLikeCount(result.likeCount);
  }, [likeFetcher.state, likeFetcher.data]);

  // 저장 액션 결과 처리 (class-detail과 동일 패턴)
  useEffect(() => {
    const prev = prevSaveState.current;
    prevSaveState.current = saveFetcher.state;

    const justFinished =
      (prev === "submitting" || prev === "loading") &&
      saveFetcher.state === "idle";
    if (!justFinished) return;

    const result = saveFetcher.data as
      | { success?: boolean; isSaved?: boolean; saveCount?: number }
      | undefined;
    if (!result?.success) return;

    if (typeof result.isSaved === "boolean") setIsSaved(result.isSaved);
    if (typeof result.saveCount === "number") setSaveCount(result.saveCount);
  }, [saveFetcher.state, saveFetcher.data]);

  const handleLikeClick = () => {
    // 낙관적 업데이트: 즉시 UI 반영
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((prev: number) =>
      Math.max(0, nextLiked ? prev + 1 : prev - 1),
    );

    likeFetcher.submit(
      { action: "toggleLike", galleryId: gallery.id },
      { method: "post" },
    );
  };

  const handleSaveClick = () => {
    // 낙관적 업데이트: 즉시 UI 반영
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setSaveCount((prev: number) =>
      Math.max(0, nextSaved ? prev + 1 : prev - 1),
    );

    saveFetcher.submit(
      { action: "toggleSave", galleryId: gallery.id },
      { method: "post" },
    );
  };

  const mainImageUrl = getMainImageUrl(
    gallery.thumbnail_image_url,
    gallery.image_urls,
  );

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-24 xl:py-40">
      {/* ---------- 1. 대표 이미지 (없으면 "이미지 없음" 표기) ---------- */}
      <div className="relative xl:h-[1000px]">
        {mainImageUrl ? (
          <div
            className="aspect-[16/12] h-full w-full rounded-2xl bg-cover bg-top xl:aspect-[16/7]"
            style={{ backgroundImage: `url(${mainImageUrl})` }}
          />
        ) : (
          <div className="flex aspect-[16/12] h-full w-full items-center justify-center rounded-2xl bg-gray-500 xl:aspect-[16/7]">
            <span className="text-text-2/70 text-h6">이미지 없음</span>
          </div>
        )}
        <div className="absolute inset-x-0 top-[60%] bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* ---------- 2. 좋아요·저장 카운트 + 클릭 시 토글 (빨간 하트 / success 색상) ---------- */}
      <div className="mt-12 flex flex-col gap-3 xl:max-w-[70%]">
        <GalleryLikeSaveButtons
          likeCount={likeCount}
          saveCount={saveCount}
          isLiked={isLiked}
          isSaved={isSaved}
          onLikeClick={handleLikeClick}
          onSaveClick={handleSaveClick}
        />

        {/* ---------- 3. 서브타이틀 (타이틀) ---------- */}
        <h1 className="text-h4 xl:text-h2">{gallery.title}</h1>
        {gallery.subtitle ? (
          <p className="xl:text-h6 text-text-2/80 text-base font-light">
            {gallery.subtitle}
          </p>
        ) : null}

        {/* ---------- 4. 실제 저장된 태그 ---------- */}
        <div className="mt-4 xl:mt-8">
          <Tags tags={gallery.tags} borderColor="primary" />
        </div>
      </div>

      {/* ---------- 5. Description ---------- */}
      {gallery.description ? (
        <div className="my-12 xl:max-w-[50%]">
          <p className="text-text-2/80 leading-loose font-light xl:text-[20px]">
            {gallery.description}
          </p>
        </div>
      ) : null}

      {/* ---------- 6. 상세 이미지들 (image_urls) ---------- */}
      {gallery.image_urls.length > 0 ? (
        <div className="xl:mt-20 flex flex-col gap-6">
          {gallery.image_urls.map((url: string, index: number) => (
            <img
              key={`${gallery.id}-img-${index}`}
              src={url}
              alt={`${gallery.title} - ${index + 1}`}
              className="w-full rounded-lg object-cover"
            />
          ))}
        </div>
      ) : null}

      {/* ---------- 7. Caption ---------- */}
      {gallery.caption ? (
        <div className="mt-8 xl:max-w-[50%]">
          <p className="text-text-2/80 text-small-title font-regular">
            {gallery.caption}
          </p>
        </div>
      ) : null}

      <Separator className="mt-26 mb-6" />

      {/* ---------- 8. 목록으로 가기, 이전/다음, 좋아요·저장 (동일 동작) ---------- */}
      <FloatingActionBar
        listHref="/gallery"
        listState={{ revalidateGalleryList: true }}
        prevHref={adjacent.prevSlug ? `/gallery/${adjacent.prevSlug}` : null}
        nextHref={adjacent.nextSlug ? `/gallery/${adjacent.nextSlug}` : null}
        likeCount={likeCount}
        saveCount={saveCount}
        isLiked={isLiked}
        isSaved={isSaved}
        onLikeClick={handleLikeClick}
        onSaveClick={handleSaveClick}
      />
    </div>
  );
}

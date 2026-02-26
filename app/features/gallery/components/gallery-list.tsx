import type { GalleryListItem } from "../queries";

import { motion } from "framer-motion";
import { Bookmark, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Link } from "react-router";
import { useFetcher } from "react-router";

import PaginationUI from "~/core/components/pagination-ui";
import Tags from "~/core/components/tags";

/** 갤러리 목록 + 페이지네이션에 필요한 props */
interface GalleryListProps {
  galleries: GalleryListItem[];
  likedGalleries: string[];
  savedGalleries: string[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
  category: string | null;
  /** 검색어(있으면 검색 결과 없음 메시지에 반영) */
  search: string | null;
  /** 카테고리 표시명 (All, Design, Publishing, Development) */
  categoryLabel: string;
}

/**
 * 갤러리 그리드와 Shadcn 페이지네이션을 렌더링
 * 클래스 목록(ClassList)과 동일한 패턴: getPageUrl로 카테고리 유지, Link 기반 페이지 이동
 */
export default function GalleryList({
  galleries,
  likedGalleries,
  savedGalleries,
  pagination,
  category,
  search,
  categoryLabel,
}: GalleryListProps) {
  const [searchParams] = useSearchParams();

  // 빠른 조회를 위해 Set으로 변환
  const likedSet = new Set(likedGalleries || []);
  const savedSet = new Set(savedGalleries || []);

  /** 현재 category·기타 쿼리를 유지하면서 page만 변경한 URL 반환 */
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `/gallery?${params.toString()}`;
  };

  if (!galleries || galleries.length === 0) {
    const searchKeyword = search != null ? search.trim() : "";
    const hasSearch = searchKeyword.length > 0;
    const emptyMessage = hasSearch
      ? `${categoryLabel} 카테고리의 "${searchKeyword}"의 검색결과가 없습니다.`
      : category && category !== "all"
        ? "해당 카테고리의 갤러리가 없습니다."
        : "등록된 갤러리가 없습니다.";
    return (
      <div className="flex min-h-[200px] items-center justify-center py-20">
        <p className="text-text-2/60 text-h6">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 gap-y-10 xl:grid-cols-4 xl:gap-6 xl:gap-y-16">
        {galleries.map((item) => (
          <GalleryCard
            key={item.id}
            item={item}
            initialLiked={likedSet.has(item.id)}
            initialSaved={savedSet.has(item.id)}
          />
        ))}
      </div>

      {/* 클래스와 동일한 Shadcn 페이지네이션: 2페이지 이상일 때만 표시 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center py-20">
          <PaginationUI
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={() => {}}
            getPageUrl={getPageUrl}
          />
        </div>
      )}
    </>
  );
}

export interface GalleryCardProps {
  item: GalleryListItem;
  initialLiked: boolean;
  initialSaved: boolean;
  /** 좋아요/저장 버튼 표시 여부 (프로필 저장 목록에서는 false) */
  showActions?: boolean;
}

/**
 * 갤러리 카드
 *
 * - 카드 전체 클릭: 상세로 이동
 * - 좋아요/저장 클릭: 페이지 이동 막고(fetcher), 낙관적 업데이트로 즉시 반영
 */
export function GalleryCard({
  item,
  initialLiked,
  initialSaved,
  showActions = true,
}: GalleryCardProps) {
  const likeFetcher = useFetcher();
  const saveFetcher = useFetcher();

  const [isLiked, setIsLiked] = useState<boolean>(initialLiked);
  const [isSaved, setIsSaved] = useState<boolean>(initialSaved);
  const [likeCount, setLikeCount] = useState<number>(item.like_count);
  const [saveCount, setSaveCount] = useState<number>(item.save_count);

  const prevLikeState = useRef(likeFetcher.state);
  const prevSaveState = useRef(saveFetcher.state);

  // props 변경(페이지 이동/재검증) 시 상태 동기화
  useEffect(() => setIsLiked(initialLiked), [initialLiked]);
  useEffect(() => setIsSaved(initialSaved), [initialSaved]);
  useEffect(() => setLikeCount(item.like_count), [item.like_count]);
  useEffect(() => setSaveCount(item.save_count), [item.save_count]);

  // 좋아요 결과 반영
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

  // 저장 결과 반영
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

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, nextLiked ? prev + 1 : prev - 1));

    likeFetcher.submit(
      { action: "toggleLike", galleryId: item.id },
      { method: "post" },
    );
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setSaveCount((prev) => Math.max(0, nextSaved ? prev + 1 : prev - 1));

    saveFetcher.submit(
      { action: "toggleSave", galleryId: item.id },
      { method: "post" },
    );
  };

  return (
    <Link to={`/gallery/${item.slug}`} key={item.id}>
      <div className="h-[200px] w-full overflow-hidden rounded-2xl md:h-[500px] lg:h-[500px]">
        <img
          src={item.thumbnail_image_url ?? ""}
          alt={item.title}
          className="h-full w-full object-cover"
        />
      </div>

      {showActions && (
        <div className="flex items-center gap-3 py-2">
          <motion.button
            type="button"
            onClick={handleLikeClick}
            whileTap={{ scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="text-text-2 hover:text-primary flex cursor-pointer items-center gap-1 transition-colors"
          >
            <Heart
              className={`size-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
            />
            <span className="text-base">
              {likeCount === 0 ? "" : likeCount}
            </span>
          </motion.button>
          <motion.button
            type="button"
            onClick={handleSaveClick}
            whileTap={{ scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="text-text-2 hover:text-primary flex cursor-pointer items-center gap-1 transition-colors"
          >
            <Bookmark
              className={`size-5 ${isSaved ? "fill-success text-success" : ""}`}
            />
            <span className="text-base">
              {saveCount === 0 ? "" : saveCount}
            </span>
          </motion.button>
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* 타이틀 */}
        <h3 className="xl:text-small-title line-clamp-1 text-base font-[600]">
          {item.title}
        </h3>
      </div>

      <Tags tags={item.tags} borderColor="text-3/50" />
    </Link>
  );
}

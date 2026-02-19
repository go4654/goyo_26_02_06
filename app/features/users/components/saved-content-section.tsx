import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";

import { Button } from "~/core/components/ui/button";
import LectureCard from "~/features/class/components/lecture-card";
import type { ClassLecture } from "~/features/class/constants/class-data";
import { GalleryCard } from "~/features/gallery/components/gallery-list";
import type { GalleryListItem } from "~/features/gallery/queries";

import { SAVED_ITEMS_PAGE_SIZE } from "../constants";

type SavedClassRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_image_url: string | null;
};

/** 로더/API에서 오는 갤러리 행 (category 없을 수 있음) */
export type InitialGalleryRow = {
  id: string;
  title: string;
  slug: string;
  thumbnail_image_url: string | null;
  like_count?: number;
  save_count?: number;
  tags?: string[];
};

type SavedItemsResponse = {
  type: "class" | "gallery" | null;
  items: unknown[];
  hasMore: boolean;
};

function toClassLecture(row: SavedClassRow): ClassLecture {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    imageUrl: row.thumbnail_image_url,
    tags: [],
  };
}

function toGalleryListItem(row: InitialGalleryRow): GalleryListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    thumbnail_image_url: row.thumbnail_image_url,
    like_count: row.like_count ?? 0,
    save_count: row.save_count ?? 0,
    tags: row.tags ?? [],
  };
}

interface SavedContentSectionProps {
  activeTab: "class" | "gallery";
  initialSavedClasses: SavedClassRow[];
  initialSavedGalleries: InitialGalleryRow[];
}

export function SavedContentSection({
  activeTab,
  initialSavedClasses,
  initialSavedGalleries,
}: SavedContentSectionProps) {
  const [classList, setClassList] = useState(initialSavedClasses);
  const [galleryList, setGalleryList] = useState(initialSavedGalleries);
  const [classHasMore, setClassHasMore] = useState(
    initialSavedClasses.length >= SAVED_ITEMS_PAGE_SIZE,
  );
  const [galleryHasMore, setGalleryHasMore] = useState(
    initialSavedGalleries.length >= SAVED_ITEMS_PAGE_SIZE,
  );

  const moreClassFetcher = useFetcher<SavedItemsResponse>();
  const moreGalleryFetcher = useFetcher<SavedItemsResponse>();

  useEffect(() => {
    const d = moreClassFetcher.data;
    if (d?.type === "class" && Array.isArray(d.items)) {
      setClassList((prev) => [...prev, ...(d.items as SavedClassRow[])]);
      setClassHasMore(d.hasMore);
    }
  }, [moreClassFetcher.data]);

  useEffect(() => {
    const d = moreGalleryFetcher.data;
    if (d?.type === "gallery" && Array.isArray(d.items)) {
      setGalleryList((prev) => [...prev, ...(d.items as InitialGalleryRow[])]);
      setGalleryHasMore(d.hasMore);
    }
  }, [moreGalleryFetcher.data]);

  const handleLoadMoreClass = () => {
    moreClassFetcher.load(
      `/api/users/saved-items?type=class&offset=${classList.length}&limit=${SAVED_ITEMS_PAGE_SIZE}`,
    );
  };
  const handleLoadMoreGallery = () => {
    moreGalleryFetcher.load(
      `/api/users/saved-items?type=gallery&offset=${galleryList.length}&limit=${SAVED_ITEMS_PAGE_SIZE}`,
    );
  };

  return (
    <div className="mt-18 pb-20">
      <h3 className="text-h6 xl:text-h6">저장한 학습 자료</h3>

      <div className="mt-3 flex items-center gap-6 border-b xl:mt-5">
        <Link
          to="?category=class"
          className={`border-b-3 border-transparent pb-2 text-sm font-medium transition-colors xl:text-base ${
            activeTab === "class"
              ? "border-primary text-primary !font-bold"
              : "text-text-2/60 hover:text-foreground font-normal"
          }`}
        >
          CLASS
        </Link>
        <Link
          to="?category=gallery"
          className={`border-b-3 border-transparent pb-2 text-sm font-medium transition-colors xl:text-base ${
            activeTab === "gallery"
              ? "border-primary text-primary !font-bold"
              : "text-text-2/60 hover:text-foreground font-normal"
          }`}
        >
          GALLERY
        </Link>
      </div>

      {activeTab === "class" && classList.length > 0 ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-2 gap-y-4 xl:mt-[50px] xl:grid-cols-4 xl:gap-6 xl:gap-y-16">
            {classList.map((row) => (
              <LectureCard
                key={row.id}
                lecture={toClassLecture(row)}
                initialSaved
                showActions={false}
              />
            ))}
          </div>
          {classHasMore && (
            <div className="mt-10 flex justify-center xl:mt-16">
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadMoreClass}
                disabled={moreClassFetcher.state !== "idle"}
                className="border-primary text-secondary hover:bg-primary/10 cursor-pointer"
              >
                {moreClassFetcher.state === "loading" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "더 보기 +"
                )}
              </Button>
            </div>
          )}
        </>
      ) : activeTab === "class" ? (
        <div className="flex items-center justify-center py-20 xl:mt-[60px]">
          <p className="text-text-2/60 text-h6">저장한 강의가 없습니다.</p>
        </div>
      ) : galleryList.length > 0 ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-2 gap-y-4 xl:mt-[50px] xl:grid-cols-4 xl:gap-6 xl:gap-y-16">
            {galleryList.map((row) => (
              <GalleryCard
                key={row.id}
                item={toGalleryListItem(row)}
                initialLiked={false}
                initialSaved
                showActions={false}
              />
            ))}
          </div>
          {galleryHasMore && (
            <div className="mt-10 flex justify-center xl:mt-16">
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadMoreGallery}
                disabled={moreGalleryFetcher.state !== "idle"}
                className="border-primary text-secondary hover:bg-primary/10 cursor-pointer"
              >
                {moreGalleryFetcher.state === "loading" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "더보기 +"
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center py-20 xl:mt-[60px]">
          <p className="text-text-2/60 text-h6">저장된 GALLERY가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

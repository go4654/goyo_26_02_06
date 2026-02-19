import type { Route } from "./+types/profile";

import { Loader2 } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import { Separator } from "~/core/components/ui/separator";
import LectureCard from "~/features/class/components/lecture-card";
import type { ClassLecture } from "~/features/class/constants/class-data";
import { GalleryCard } from "~/features/gallery/components/gallery-list";
import type { GalleryListItem } from "~/features/gallery/queries";

import UserGraph from "../components/user-graph";
import { SAVED_ITEMS_PAGE_SIZE } from "../constants";
import { profileAction } from "../server/profile.action";
import { profileLoader } from "../server/profile.loader";

/** 로더/API 저장 클래스 아이템 → LectureCard용 ClassLecture */
function toClassLecture(row: {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail_image_url: string | null;
}): ClassLecture {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    imageUrl: row.thumbnail_image_url,
    tags: [],
  };
}

/** 로더/API 저장 갤러리 아이템 → GalleryListItem */
function toGalleryListItem(row: {
  id: string;
  title: string;
  slug: string;
  thumbnail_image_url: string | null;
  like_count?: number;
  save_count?: number;
  tags?: string[];
}): GalleryListItem {
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

/** 마지막 학습일을 "오늘" / "어제" / "N일 전" 형식으로 반환 (Luxon 사용) */
function formatLastLearningDate(date: Date | null): string {
  if (!date) return "—";
  const dt = DateTime.fromJSDate(date).toUTC().startOf("day");
  const today = DateTime.utc().startOf("day");
  const diffDays = Math.floor(today.diff(dt, "days").days);
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  return `${diffDays}일 전`;
}

export const meta: Route.MetaFunction = () => {
  return [{ title: `프로필 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = profileLoader;
export const action = profileAction;

type SavedItemsResponse = {
  type: "class" | "gallery" | null;
  items: unknown[];
  hasMore: boolean;
};

export default function Profile({ loaderData }: Route.ComponentProps) {
  const {
    category,
    savedClassCount,
    savedGalleryCount,
    weeklyLearningCount,
    learningSummary,
    recentViews = [],
    savedClasses = [],
    savedGalleries = [],
  } = loaderData;
  const activeTab = category ?? "class";

  const [classList, setClassList] = useState(savedClasses);
  const [galleryList, setGalleryList] = useState(savedGalleries);
  const [classHasMore, setClassHasMore] = useState(
    savedClasses.length >= SAVED_ITEMS_PAGE_SIZE,
  );
  const [galleryHasMore, setGalleryHasMore] = useState(
    savedGalleries.length >= SAVED_ITEMS_PAGE_SIZE,
  );

  const moreClassFetcher = useFetcher<SavedItemsResponse>();
  const moreGalleryFetcher = useFetcher<SavedItemsResponse>();

  useEffect(() => {
    const d = moreClassFetcher.data;
    if (d?.type === "class" && Array.isArray(d.items)) {
      setClassList((prev) => [...prev, ...(d.items as typeof savedClasses)]);
      setClassHasMore(d.hasMore);
    }
  }, [moreClassFetcher.data]);

  useEffect(() => {
    const d = moreGalleryFetcher.data;
    if (d?.type === "gallery" && Array.isArray(d.items)) {
      setGalleryList((prev) => [
        ...prev,
        ...(d.items as typeof savedGalleries),
      ]);
      setGalleryHasMore(d.hasMore);
    }
  }, [moreGalleryFetcher.data]);

  const mostExplored =
    learningSummary?.mostExploredCategory?.toUpperCase() ?? "—";
  const lastLearningLabel = formatLastLearningDate(
    learningSummary?.lastLearningDate ?? null,
  );
  const lastViewedClass = recentViews.find((v) => v.type === "class" && v.slug);

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
    <div className="mx-auto max-w-[1280px] px-5 pt-20 pb-8 xl:px-0 xl:py-30">
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
        {/* 프로필 카드, 가장많이 탐색, 마지막 학습일, 이번주 학습 */}
        <div className="flex flex-col gap-8 rounded-[20px] bg-[#0F1117] p-4 xl:p-10">
          <h3 className="text-h5">Profile</h3>

          {/* 유저 정보 */}
          <div className="flex items-center gap-4 xl:mt-8">
            <Avatar className="size-28 xl:size-50">
              <AvatarImage src={loaderData.profile.avatar_url ?? undefined} />
              <AvatarFallback>
                {loaderData.profile.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            {/* 유저네임, 이메일 */}
            <div className="flex flex-col gap-0 xl:gap-1">
              <span className="text-small-title xl:text-h6">
                {loaderData.profile.name}
              </span>
              <span className="text-muted-foreground text-small xl:text-sm">
                {loaderData.email}
              </span>

              <Button
                asChild
                variant="outline"
                className="border-secondary dark:border-secondary dark:hover:bg-primary xl:text-md mt-3 border-1 py-3 text-sm font-medium xl:mt-6 xl:px-6 xl:py-4"
              >
                <Link to="/user/profile">프로필 수정 &rarr;</Link>
              </Button>
            </div>
          </div>

          <Separator className="my-5 xl:my-10" />

          <ul className="flex justify-around pb-4 text-center">
            <li className="flex flex-col items-center gap-1">
              <p className="text-text-2/80 text-[10px] xl:text-sm">
                가장 많이 탐색한 분야
              </p>
              <div className="text-small-title xl:text-h5">{mostExplored}</div>
            </li>

            <Separator orientation="vertical" className="h-full" />

            <li className="flex flex-col items-center gap-1">
              <p className="text-text-2/80 text-[10px] xl:text-sm">
                마지막 학습일
              </p>
              <div className="text-small-title xl:text-h5">
                {lastLearningLabel === "오늘" ||
                lastLearningLabel === "어제" ||
                lastLearningLabel === "—" ? (
                  lastLearningLabel
                ) : (
                  <>
                    {lastLearningLabel.replace(/\s*일 전$/, "")}
                    <span className="text-text-2/80 text-sm"> 일 전</span>
                  </>
                )}
              </div>
            </li>

            <Separator orientation="vertical" className="h-full" />

            <li className="flex flex-col items-center gap-1">
              <p className="text-text-2/80 text-[10px] xl:text-sm">
                이번주 학습
              </p>
              <div
                className="text-small-title xl:text-h5 w-full max-w-[120px] truncate text-center xl:max-w-[200px]"
                title={lastViewedClass?.title}
              >
                {weeklyLearningCount}{" "}
                <span className="text-text-2/80 text-sm">개</span>
              </div>
            </li>
          </ul>
        </div>

        {/* 기록 카드, 저장한 클래스, 저장한 갤러리, 최근 학습 주제 */}
        <div className="flex flex-col gap-5 rounded-[20px]">
          <ul className="grid grid-cols-3 gap-3 xl:gap-5">
            <li className="flex flex-col items-center gap-1 rounded-xl bg-[#0F1117] p-4 xl:p-14">
              <p className="text-text-2/80 text-[10px] xl:text-sm">
                저장한 클래스
              </p>
              <div className="text-small-title xl:text-h4">
                {savedClassCount}{" "}
                <span className="text-text-2/80 text-sm">개</span>
              </div>
            </li>

            <li className="flex flex-col items-center gap-1 rounded-xl bg-[#0F1117] p-4 xl:p-14">
              <p className="text-text-2/80 text-[10px] xl:text-sm">
                저장한 갤러리
              </p>
              <div className="text-small-title xl:text-h4">
                {savedGalleryCount}{" "}
                <span className="text-text-2/80 text-sm">개</span>
              </div>
            </li>

            <li className="flex min-w-0 flex-col items-center gap-1 rounded-xl bg-[#0F1117] p-4 xl:px-6 xl:py-14">
              <p className="text-text-2/80 text-[10px] xl:text-sm">
                최근 학습 주제
              </p>
              <div
                className="text-small w-full min-w-0 overflow-hidden text-center text-ellipsis"
                title={lastViewedClass?.title}
              >
                {lastViewedClass ? (
                  <Link
                    to={`/class/${lastViewedClass.slug}`}
                    className="hover:text-primary block overflow-hidden text-ellipsis whitespace-nowrap hover:underline"
                  >
                    {lastViewedClass.title}
                  </Link>
                ) : (
                  "—"
                )}
              </div>
            </li>
          </ul>

          {/* 학습 흐름 그래프 (RPC get_profile_weekly_learning 데이터) */}
          <UserGraph data={loaderData.weeklyLearningChartData ?? []} />
        </div>
      </div>

      {/* 저장한 학습 자료 */}
      <div className="mt-18 pb-20">
        <h3 className="text-h6 xl:text-h6">저장한 학습 자료</h3>

        {/* 학습 자료 탭 */}
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

        {/* 저장 컨텐츠 */}
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
    </div>
  );
}

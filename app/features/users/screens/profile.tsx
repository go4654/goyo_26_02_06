import type { Route } from "./+types/profile";

import { DateTime } from "luxon";
import { Link } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import { Separator } from "~/core/components/ui/separator";
import LectureCard from "~/features/class/components/lecture-card";

import UserGraph from "../components/user-graph";
import { profileAction } from "../server/profile.action";
import { profileLoader } from "../server/profile.loader";

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

export default function Profile({ loaderData }: Route.ComponentProps) {
  const {
    category,
    savedLectures,
    savedClassCount,
    savedGalleryCount,
    weeklyLearningCount,
    learningSummary,
    recentViews = [],
  } = loaderData;
  const activeCategory = category ?? "class";
  const mostExplored =
    learningSummary?.mostExploredCategory?.toUpperCase() ?? "—";
  const lastLearningLabel = formatLastLearningDate(
    learningSummary?.lastLearningDate ?? null,
  );
  // 최근 학습 주제: 클래스 중 마지막으로 본 주제 하나만
  const lastViewedClass = recentViews.find((v) => v.type === "class" && v.slug);

  return (
    <div className="mx-auto max-w-[1280px] px-5 pt-20 pb-8 xl:px-0 xl:py-40">
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
        {/* 프로필 카드 */}
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

        {/* 기록 카드 */}
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
                className="text-small-title w-full min-w-0 overflow-hidden text-center text-ellipsis"
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
      <div className="mt-18">
        <h3 className="text-h6 xl:text-h4">저장한 학습 자료</h3>

        {/* 학습 자료 탭 */}
        <div className="mt-3 flex items-center gap-6 xl:mt-5">
          <Link
            to={`?category=class`}
            className={`text-text-2 border-b-3 border-transparent pb-2 text-sm font-medium transition-colors xl:text-base ${
              activeCategory === "class"
                ? "border-primary text-text-1"
                : "hover:text-text-1"
            }`}
          >
            CLASS
          </Link>
          <Link
            to={`?category=gallery`}
            className={`text-text-2 border-b-3 border-transparent pb-2 text-sm font-medium transition-colors xl:text-base ${
              activeCategory === "gallery"
                ? "border-primary text-text-1"
                : "hover:text-text-1"
            }`}
          >
            GALLERY
          </Link>
        </div>

        {/* 저장 컨텐츠 */}
        {activeCategory === "class" && savedLectures.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-2 gap-y-10 xl:mt-[50px] xl:grid-cols-4 xl:gap-6 xl:gap-y-16">
            {savedLectures.map((lecture) => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </div>
        ) : activeCategory === "class" ? (
          <div className="flex items-center justify-center py-20 xl:mt-[60px]">
            <p className="text-text-2/60 text-h6">저장한 강의가 없습니다.</p>
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 xl:mt-[60px]">
            <p className="text-text-2/60 text-h6">저장된 GALLERY가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

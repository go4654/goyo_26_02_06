import type { WeeklyLearningChartItem } from "./user-graph";

import { Link } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import { Separator } from "~/core/components/ui/separator";

import UserGraph from "./user-graph";

interface ProfileOverviewSectionProps {
  profile: { name: string; avatar_url: string | null };
  email: string | undefined;
  mostExplored: string;
  lastLearningLabel: string;
  weeklyLearningCount: number;
  savedClassCount: number;
  savedGalleryCount: number;
  lastViewedClass: { title: string; slug: string } | null;
  weeklyLearningChartData: WeeklyLearningChartItem[];
}

export function ProfileOverviewSection({
  profile,
  email,
  mostExplored,
  lastLearningLabel,
  weeklyLearningCount,
  savedClassCount,
  savedGalleryCount,
  lastViewedClass,
  weeklyLearningChartData,
}: ProfileOverviewSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
      {/* 프로필 카드, 가장많이 탐색, 마지막 학습일, 이번주 학습 */}
      <div className="flex flex-col gap-8 rounded-[20px] bg-[#0F1117] p-4 xl:p-10">
        <h3 className="text-h5">Profile</h3>

        <div className="flex items-center gap-6 xl:mt-8">
          <Avatar className="size-28 xl:size-50">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback>{profile.name.slice(0, 2)}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-0 xl:gap-1">
            <span className="text-small-title xl:text-h6">{profile.name}</span>
            <span className="text-muted-foreground text-small xl:text-sm">
              {email}
            </span>

            <div className="flex flex-col">
              <Button
                asChild
                className="dark:hover:bg-primary xl:text-md mt-3 border-1 py-3 text-xs font-medium xl:mt-6 xl:px-6 xl:py-4 xl:text-sm"
              >
                <Link to="/user/profile">프로필 수정 &rarr;</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="dark:text-text-2 dark:hover:text-text-2 xl:text-md text-text-2 mt-3 border-1 py-3 text-xs font-medium xl:mt-2 xl:px-6 xl:py-4 xl:text-sm"
              >
                <Link to="/inquiries">내 문의 보기</Link>
              </Button>
            </div>
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
            <p className="text-text-2/80 text-[10px] xl:text-sm">이번주 학습</p>
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
              className="text-small xl:text-h6 w-full min-w-0 overflow-hidden text-center text-ellipsis"
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
        <UserGraph data={weeklyLearningChartData} />
      </div>
    </div>
  );
}

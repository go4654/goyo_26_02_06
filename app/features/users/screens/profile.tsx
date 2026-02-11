import type { Route } from "./+types/profile";

import { Link } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import { Separator } from "~/core/components/ui/separator";
import LectureCard from "~/features/class/components/lecture-card";
import HomeMoreBtn from "~/features/home/components/home-more-btn";

import UserGraph from "../components/user-graph";
import { profileAction } from "../server/profile.action";
import { profileLoader } from "../server/profile.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: `프로필 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = profileLoader;
export const action = profileAction;

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { category, savedLectures } = loaderData;
  const activeCategory = category ?? "class";

  return (
    <div className="mx-auto max-w-[1280px] pt-20 pb-8 xl:py-40">
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
        {/* 프로필 카드 */}
        <div className="flex flex-col gap-8 rounded-[20px] bg-[#0F1117] p-5 xl:p-10">
          <h3 className="text-h5">Profile</h3>

          {/* 유저 정보 */}
          <div className="flex items-center gap-8 xl:mt-8">
            <Avatar className="size-50">
              <AvatarImage src={loaderData.profile.avatar_url ?? undefined} />
              <AvatarFallback>
                {loaderData.profile.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            {/* 유저네임, 이메일 */}
            <div className="flex flex-col gap-1">
              <span className="text-h6">{loaderData.profile.name}</span>
              <span className="text-muted-foreground text-sm">
                {loaderData.email}
              </span>

              <Button
                asChild
                variant="outline"
                className="border-secondary dark:border-secondary dark:hover:bg-primary md:text-md mt-6 border-1 py-5 text-sm font-medium md:px-6 md:py-4"
              >
                <Link to="/user/profile">프로필 수정 &rarr;</Link>
              </Button>
            </div>
          </div>

          <Separator className="my-10" />

          <ul className="flex justify-around text-center">
            <li className="flex flex-col items-center gap-1">
              <p className="text-text-2/80 text-sm">가장 많이 탐색한 분야</p>
              <div className="text-h5">REACT</div>
            </li>

            <Separator orientation="vertical" className="h-full" />

            <li className="flex flex-col items-center gap-1">
              <p className="text-text-2/80 text-sm">마지막 학습일</p>
              <div className="text-h5">
                3 <span className="text-text-2/80 text-sm">일전</span>
              </div>
            </li>

            <Separator orientation="vertical" className="h-full" />

            <li className="flex flex-col items-center gap-1">
              <p className="text-text-2/80 text-sm">최근 학습 주제</p>
              <div className="text-h5">REACT</div>
            </li>
          </ul>
        </div>

        {/* 기록 카드 */}
        <div className="flex flex-col gap-5 rounded-[20px]">
          <ul className="grid grid-cols-3 gap-5">
            <li className="flex flex-col items-center gap-1 rounded-xl bg-[#0F1117] p-10">
              <p className="text-text-2/80 text-sm">최근 열람한 기록</p>
              <div className="text-h4">
                340 <span className="text-text-2/80 text-sm">개</span>
              </div>
            </li>

            <li className="flex flex-col items-center gap-1 rounded-xl bg-[#0F1117] p-10">
              <p className="text-text-2/80 text-sm">저장한 기록</p>
              <div className="text-h4">
                340 <span className="text-text-2/80 text-sm">개</span>
              </div>
            </li>

            <li className="flex flex-col items-center gap-1 rounded-xl bg-[#0F1117] p-10">
              <p className="text-text-2/80 text-sm">이번주 학습</p>
              <div className="text-h4">
                340 <span className="text-text-2/80 text-sm">개</span>
              </div>
            </li>
          </ul>
          {/* 학습 흐름 그래프 */}
          <UserGraph />
        </div>
      </div>

      {/* 저장한 학습 자료 */}
      <div className="mt-18">
        <h3 className="text-h4">저장한 학습 자료</h3>

        {/* 학습 자료 탭 */}
        <div className="mt-5 flex items-center gap-6">
          <Link
            to={`?category=class`}
            className={`text-text-2 border-b-3 border-transparent pb-2 text-base font-medium transition-colors ${
              activeCategory === "class"
                ? "border-primary text-text-1"
                : "hover:text-text-1"
            }`}
          >
            CLASS
          </Link>
          <Link
            to={`?category=gallery`}
            className={`text-text-2 border-b-3 border-transparent pb-2 text-base font-medium transition-colors ${
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
          <div className="mt-12 grid grid-cols-2 gap-2 gap-y-10 xl:mt-[50px] xl:grid-cols-4 xl:gap-6 xl:gap-y-16">
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

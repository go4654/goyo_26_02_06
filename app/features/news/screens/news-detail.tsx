import type { Route } from "./+types/news-detail";

import { Heart, MoveLeft, MoveRight } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { Separator } from "~/core/components/ui/separator";

import { NEWS_DETAIL_DATA } from "../constants/new-mockup";
import { newsDetailAction } from "../server/news-detail.action";
import { newsDetailLoader } from "../server/news-detail.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: "뉴스 상세 페이지" }];
};

export const loader = newsDetailLoader;
export const action = newsDetailAction;

export default function NewsDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-[800px] px-5 py-24 xl:py-40">
      {/* 타이틀 영역 */}
      <div className="flex flex-col items-start gap-5">
        <div className="">
          <div className="text-small xl:text-small-title text-primary">
            NOTICE
          </div>
          <h1 className="text-h5 xl:text-h3">
            GOYO 아카이브 시스템 고도화: 학습의 경계를 허무는 '연결된 기록'
            업데이트 안내
          </h1>
        </div>
        <span className="text-text-2/80 text-small xl:text-small-title font-light">
          2026.02.10
        </span>
      </div>

      <Separator className="my-10" />

      {/* dangerouslySetInnerHTML를 사용할 때는 반드시 prose 클래스로 스타일을 잡아줍니다. */}
      <div
        className="prose prose-neutral xl:prose-lg prose-p:leading-9 prose-p:text-neutral-700 prose-p:tracking-tight prose-h3:mt-16 prose-h3:pb-4 prose-h3:border-b prose-h3:border-neutral-100 prose-h3:text-3xl prose-h3:font-extrabold prose-h3:text-neutral-900 prose-blockquote:not-italic prose-blockquote:border-l-4 prose-blockquote:border-secondary prose-blockquote:bg-neutral-50 prose-blockquote:rounded-r-2xl prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:text-neutral-700 prose-blockquote:font-medium prose-blockquote:shadow-sm prose-strong:text-secondary prose-strong:font-bold prose-strong:bg-secondary/5 prose-strong:px-1 prose-strong:rounded-sm prose-img:rounded-3xl prose-img:shadow-xl prose-img:my-12 prose-li:text-neutral-600 prose-ol:font-semibold prose-a:text-secondary prose-a:no-underline hover:prose-a:underline max-w-none"
        dangerouslySetInnerHTML={{ __html: NEWS_DETAIL_DATA.content }}
      />

      <Separator className="mt-26 mb-6" />

      {/* 목록으로가기, 좋아요, 북마크 버튼 */}
      <div className="flex w-full flex-col items-center justify-between">
        <div className="flex w-full items-center justify-between">
          {/* 목록으로가기 */}
          <div
            className="xl:text-small-title text-text-2 hover:text-primary flex cursor-pointer items-center gap-2 text-sm"
            onClick={() => navigate(-1)}
          >
            <MoveLeft className="size-4" />
            <span>목록으로 가기</span>
          </div>
        </div>

        <div className="mt-10 flex w-[180px] items-center justify-between xl:w-[220px]">
          <Link to="/news/1" className="group flex items-center gap-2">
            <div className="border-text-2 flex h-[30px] w-[30px] items-center justify-start rounded-full border group-hover:border-white xl:h-[35px] xl:w-[35px]">
              <MoveLeft
                className="text-text-2 ml-1 size-4 transition-all duration-300 group-hover:text-white xl:size-5"
                strokeWidth={1}
              />
            </div>
            <span className="text-small-title text-text-2 text-sm transition-all duration-300 group-hover:text-white xl:text-base">
              PREV
            </span>
          </Link>

          <Link to="/news/2" className="group flex items-center gap-2">
            <span className="text-small-title text-text-2 xl:text-bas e text-sm transition-all duration-300 group-hover:text-white">
              NEXT
            </span>
            <div className="border-text-2 flex h-[30px] w-[30px] items-center justify-start rounded-full border group-hover:border-white xl:h-[35px] xl:w-[35px]">
              <MoveRight
                className="text-text-2 ml-1 size-4 transition-all duration-300 group-hover:text-white xl:size-5"
                strokeWidth={1}
              />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

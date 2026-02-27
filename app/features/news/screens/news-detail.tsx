import type { Route } from "./+types/news-detail";

import { MoveLeft } from "lucide-react";
import { Link } from "react-router";

import { MDXNewsContent } from "~/core/components/mdx-news-content";
import { Separator } from "~/core/components/ui/separator";

import { newsDetailAction } from "../server/news-detail.action";
import { newsDetailLoader } from "../server/news-detail.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: "뉴스 상세 페이지" }];
};

export const loader = newsDetailLoader;
export const action = newsDetailAction;

/** published_at을 YY.MM.DD 형식으로 포맷 */
function formatNewsDate(dateString: string | null): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export default function NewsDetail({ loaderData }: Route.ComponentProps) {
  const { news } = loaderData;

  return (
    <div className="mx-auto max-w-[800px] px-5 py-6 xl:py-16">
      {/* 타이틀 영역 */}
      <div className="flex flex-col items-start gap-2 xl:gap-5">
        <div>
          <div className="text-small xl:text-small-title text-primary">
            {news.category}
          </div>
          <h1 className="text-h5 xl:text-h3">{news.title}</h1>
        </div>
        <div className="text-text-2/80 text-small flex items-center gap-2 font-light xl:text-base">
          <span>{formatNewsDate(news.published_at)}</span>

          {news.view_count > 0 && (
            <>
              <span>•</span>
              <span>조회수 {news.view_count}회</span>
            </>
          )}
        </div>
      </div>

      <Separator className="my-10" />

      <MDXNewsContent code={loaderData.contentCode} />

      <Separator className="mt-26 mb-6" />

      {/* 목록으로 가기 */}
      <div className="flex w-full flex-col items-center justify-between">
        <div className="flex w-full items-center justify-between">
          <Link
            to="/news"
            className="xl:text-small-title text-text-2 hover:text-primary flex items-center gap-2 text-sm"
          >
            <MoveLeft className="size-4" />
            <span>목록으로 가기</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

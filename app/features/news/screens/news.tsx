import type { Route } from "./+types/news";

import { Link, useSearchParams } from "react-router";

import PaginationUI from "~/core/components/pagination-ui";

import { NEWS_MOCK_DATA } from "../constants/new-mockup";
import { newsAction } from "../server/news.action";
import { newsLoader } from "../server/news.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: "뉴스 페이지" }];
};

export const loader = newsLoader;
export const action = newsAction;

export default function News() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);

  const totalPages = Math.ceil(NEWS_MOCK_DATA.length / 10);

  // 페이지 번호 클릭 시 페이지 번호 변경
  const onClick = (page: number) => {
    searchParams.set("page", page.toString());
    setSearchParams(searchParams);
  };

  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 py-24 xl:py-40">
      {/* 상단 타이틀 */}
      <div className="flex items-end justify-between">
        <h1 className="text-h4 xl:text-h1 max-w-[600px]">
          What's <span className="text-primary">NEWS.</span>
        </h1>

        <div>
          <span>총 게시물 </span>
          <span className="text-primary">100</span>
          <span>개</span>
        </div>
      </div>

      {/* 뉴스 목록 */}
      <div className="xl:mt-20">
        {NEWS_MOCK_DATA.map((data) => (
          <Link
            key={data.id}
            to={`/news/${data.id}`}
            className="border-text-3/25 flex items-center gap-20 border-t py-8 last:border-b"
          >
            {/* 날짜 */}
            <p className="text-text-2 text-[24px] font-extralight xl:text-[32px]">
              {data.date}
            </p>

            {/* 뉴스 카테고리 및 제목 */}
            <div>
              <span className="text-secondary xl:text-small-title xl:text-base">
                {data.category}
              </span>
              <h3 className="xl:text-h5 font-medium">{data.title}</h3>
            </div>
          </Link>
        ))}
      </div>

      {/* 페이지네이션 */}
      <PaginationUI
        className="xl:mt-20"
        page={page}
        totalPages={totalPages}
        onPageChange={onClick}
        getPageUrl={(p) => `?page=${p}`}
      />
    </div>
  );
}

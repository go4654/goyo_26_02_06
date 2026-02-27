import type { Route } from "./+types/news";

import { Link, useSearchParams } from "react-router";

import PaginationUI from "~/core/components/pagination-ui";

import { newsAction } from "../server/news.action";
import { newsLoader } from "../server/news.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: "뉴스 페이지" }];
};

export const loader = newsLoader;
export const action = newsAction;

/** published_at 또는 created_at을 YY.MM.DD 형식으로 포맷 */
function formatNewsDate(dateString: string | null): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export default function News({ loaderData }: Route.ComponentProps) {
  const { items, pagination } = loaderData;
  const [searchParams] = useSearchParams();

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `/news?${params.toString()}`;
  };

  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 py-6 xl:py-16">
      {/* 상단 타이틀 */}
      <div className="flex items-end justify-between">
        <h1 className="text-h4 xl:text-h1 max-w-[600px]">
          What's <span className="text-primary">NEWS.</span>
        </h1>
        <div className="text-text-2 text-small font-extralight">
          <span>총 게시물 </span>
          <span className="text-primary">{pagination.totalCount}</span>
          <span>개</span>
        </div>
      </div>

      {/* 뉴스 목록 */}
      <div className="mt-6 xl:mt-18">
        {items.length === 0 ? (
          <p className="text-text-2/60 text-h6 py-12 text-center">
            등록된 뉴스가 없습니다.
          </p>
        ) : (
          items.map((item, index) => (
            <Link
              key={item.id}
              to={`/news/${encodeURIComponent(item.slug)}`}
              className={`group border-text-3/25 relative flex items-center gap-6 border-t py-4 transition-colors last:border-b xl:gap-20 xl:py-8 ${
                index === 0 ? "border-t-0" : ""
              }`}
            >
              <p className="text-text-2 text-small group-hover:text-text-1 font-extralight transition-colors duration-300 xl:text-[32px]">
                {formatNewsDate(item.published_at)}
              </p>

              <div className="transition-transform duration-300 group-hover:translate-x-1">
                <span className="text-secondary text-small xl:text-base">
                  {item.category}
                </span>

                <h3 className="xl:text-h5 group-hover:text-primary text-small-title font-[500] transition-colors duration-300">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <PaginationUI
          className="mt-10 xl:mt-20"
          page={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={() => {}}
          getPageUrl={getPageUrl}
        />
      )}
    </div>
  );
}

import { useSearchParams } from "react-router";

import { Heart } from "lucide-react";
import { Link } from "react-router";

import PaginationUI from "~/core/components/pagination-ui";
import Tags from "~/core/components/tags";

import type { GalleryListItem } from "../queries";

/** 갤러리 목록 + 페이지네이션에 필요한 props */
interface GalleryListProps {
  galleries: GalleryListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
  category: string | null;
}

/**
 * 갤러리 그리드와 Shadcn 페이지네이션을 렌더링
 * 클래스 목록(ClassList)과 동일한 패턴: getPageUrl로 카테고리 유지, Link 기반 페이지 이동
 */
export default function GalleryList({
  galleries,
  pagination,
  category,
}: GalleryListProps) {
  const [searchParams] = useSearchParams();

  /** 현재 category·기타 쿼리를 유지하면서 page만 변경한 URL 반환 */
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `/gallery?${params.toString()}`;
  };

  if (!galleries || galleries.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-20">
        <p className="text-text-2/60 text-h6">
          {category && category !== "all"
            ? "해당 카테고리의 갤러리가 없습니다."
            : "등록된 갤러리가 없습니다."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 gap-y-10 xl:grid-cols-4 xl:gap-6 xl:gap-y-16">
        {galleries.map((item) => (
          <Link to={`/gallery/${item.slug}`} key={item.id}>
            <div className="h-[200px] w-full overflow-hidden rounded-2xl md:h-[500px] lg:h-[500px]">
              <img
                src={item.thumbnail_image_url ?? ""}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mt-2 mb-2 flex items-center justify-between">
              <h3 className="text-small md:text-small-title line-clamp-1">
                {item.title}
              </h3>
              <div className="text-text-2 flex items-center gap-1 md:gap-2">
                <Heart className="size-4 md:size-5" />
                <span className="text-sm md:text-base">{item.like_count}</span>
              </div>
            </div>

            <Tags tags={item.tags} borderColor="primary" />
          </Link>
        ))}
      </div>

      {/* 클래스와 동일한 Shadcn 페이지네이션: 2페이지 이상일 때만 표시 */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex justify-center xl:mt-16">
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

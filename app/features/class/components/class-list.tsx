import { useSearchParams } from "react-router";

import PaginationUI from "~/core/components/pagination-ui";
import LectureCard from "~/features/class/components/lecture-card";
import { type ClassListItem } from "~/features/class/queries";

interface ClassListProps {
  classes: ClassListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
  search: string | null;
  category: string | null;
  likedClasses: string[];
  savedClasses: string[];
}

export default function ClassList({
  classes,
  pagination,
  search,
  category,
  likedClasses,
  savedClasses,
}: ClassListProps) {
  const [searchParams] = useSearchParams();

  // Set으로 변환하여 빠른 조회 가능하도록 함
  const likedClassesSet = new Set(likedClasses || []);
  const savedClassesSet = new Set(savedClasses || []);

  /**
   * 페이지네이션 URL 생성 함수
   * 현재 카테고리와 검색어를 유지하면서 페이지 번호만 변경
   */
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `/class?${params.toString()}`;
  };

  /**
   * 페이지 변경 핸들러 (클라이언트 사이드 네비게이션)
   */
  const handlePageChange = (page: number) => {
    // React Router의 Link 컴포넌트가 자동으로 처리하므로 빈 함수
  };

  if (!classes || classes.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 xl:mt-[160px]">
        <p className="text-text-2/60 text-h6">
          {search
            ? "검색 결과가 없습니다."
            : category && category.length > 0
              ? "해당 카테고리에 강의가 없습니다."
              : "강의를 선택해주세요."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-12 grid grid-cols-2 gap-2 gap-y-10 xl:mt-[120px] xl:grid-cols-4 xl:gap-6 xl:gap-y-16">
        {classes.map((classItem: ClassListItem) => (
          <LectureCard
            key={classItem.id}
            lecture={{
              id: classItem.id,
              title: classItem.title,
              imageUrl: classItem.thumbnail_image_url || "",
              category: classItem.category,
              tags: [], // TODO: tags 필드가 스키마에 추가되면 연결
              slug: classItem.slug,
            }}
            initialLiked={likedClassesSet.has(classItem.id)}
            initialSaved={savedClassesSet.has(classItem.id)}
          />
        ))}
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex justify-center xl:mt-16">
          <PaginationUI
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            getPageUrl={getPageUrl}
          />
        </div>
      )}
    </>
  );
}

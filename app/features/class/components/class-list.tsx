import { useEffect, useRef } from "react";
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
  const resultsRef = useRef<HTMLDivElement>(null);
  const prevSearchRef = useRef<string | null>(null);

  // Set으로 변환하여 빠른 조회 가능하도록 함
  const likedClassesSet = new Set(likedClasses || []);
  const savedClassesSet = new Set(savedClasses || []);

  // 검색 결과가 나왔을 때 부드럽게 스크롤
  useEffect(() => {
    // 검색어가 변경되었고, 검색 결과가 있는 경우에만 스크롤
    const hasSearchChanged = prevSearchRef.current !== search;
    const hasResults = classes && classes.length > 0;
    const isInitialLoad = prevSearchRef.current === null && search === null;

    // 초기 로드가 아니고, 검색어가 변경되었으며, 검색 결과가 있는 경우에만 스크롤
    if (!isInitialLoad && hasSearchChanged && hasResults && resultsRef.current) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤
      const timeoutId = setTimeout(() => {
        if (resultsRef.current) {
          // 부드러운 스크롤 애니메이션
          // 반응형을 고려하여 적절한 offset 적용
          const element = resultsRef.current;
          const elementPosition = element.getBoundingClientRect().top;
          const offset = window.innerWidth >= 1280 ? 120 : 80; // xl: 120px, 기본: 80px
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: Math.max(0, offsetPosition), // 음수 방지
            behavior: "smooth",
          });
        }
      }, 150);

      return () => clearTimeout(timeoutId);
    }

    // 이전 검색어 업데이트
    prevSearchRef.current = search;
  }, [search, classes]);

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
      <div
        ref={resultsRef}
        className="mt-12 grid grid-cols-2 gap-2 gap-y-10 xl:mt-[120px] xl:grid-cols-4 xl:gap-6 xl:gap-y-16"
      >
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

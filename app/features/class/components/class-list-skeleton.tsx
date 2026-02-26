import { Skeleton } from "~/core/components/ui/skeleton";

/** 페이지당 표시 개수와 동일 (class.loader DEFAULT_PAGE_SIZE) */
const SKELETON_COUNT = 12;

/**
 * 강의 목록 로딩 중 표시용 스켈레톤
 * ClassList 그리드·카드 레이아웃과 동일한 구조
 */
export default function ClassListSkeleton() {
  return (
    <div
      className="mt-12 grid grid-cols-2 gap-2 gap-y-10 xl:mt-[120px] xl:grid-cols-4 xl:gap-6 xl:gap-y-16"
      aria-busy="true"
      aria-label="강의 목록 로딩 중"
    >
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 xl:gap-4">
          {/* 썸네일 영역 (LectureCard 이미지 높이와 동일) */}
          <Skeleton className="h-[200px] w-full rounded-xl xl:h-[250px] xl:rounded-[20px]" />
          {/* 타이틀 */}
          <Skeleton className="h-4 w-3/4 rounded" />
          {/* 태그 영역 */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-14 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

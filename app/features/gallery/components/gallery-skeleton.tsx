import { Skeleton } from "~/core/components/ui/skeleton";

/** 페이지당 표시 개수와 동일 (gallery.loader DEFAULT_PAGE_SIZE) */
const SKELETON_COUNT = 12;

/**
 * 갤러리 목록 페이지 로딩 스켈레톤
 *
 * 갤러리 페이지 레이아웃과 동일한 구조:
 * - 카테고리 탭 + 검색 폼 영역
 * - 안내 문구 영역
 * - 갤러리 그리드 (GalleryList와 동일 그리드)
 */
export default function GallerySkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 xl:py-20">
      {/* 카테고리 탭 + 검색 폼 영역 */}
      <div className="flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-center">
        <ul className="xl:text-h6 order-2 flex items-center gap-10 xl:order-1">
          {[1, 2, 3, 4].map((i) => (
            <li key={i}>
              <Skeleton className="h-5 w-16 rounded xl:w-20" />
            </li>
          ))}
        </ul>
        <div className="mt-4 w-full xl:mt-0 xl:w-[500px]">
          <Skeleton className="h-[40px] w-full rounded-full xl:h-[50px]" />
        </div>
      </div>

      {/* 안내 문구 영역 */}
      <div className="pt-10 pb-4 xl:pt-14">
        <Skeleton className="h-4 w-full max-w-[600px] rounded" />
      </div>

      {/* 갤러리 그리드 (GalleryList와 동일: 2열 / xl:4열, 12개) */}
      <div
        className="grid grid-cols-2 gap-2 gap-y-10 xl:grid-cols-4 xl:gap-6 xl:gap-y-16"
        aria-busy="true"
        aria-label="갤러리 목록 로딩 중"
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            {/* 카드 이미지 (GalleryCard: h-[200px] md:h-[500px]) */}
            <Skeleton className="h-[200px] w-full rounded-2xl xl:h-[500px]" />
            {/* 좋아요/저장 버튼 영역 */}
            <div className="flex gap-3 py-2">
              <Skeleton className="h-5 w-14 rounded" />
              <Skeleton className="h-5 w-14 rounded" />
            </div>
            {/* 타이틀 */}
            <Skeleton className="h-4 w-3/4 rounded" />
            {/* 태그 영역 */}
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

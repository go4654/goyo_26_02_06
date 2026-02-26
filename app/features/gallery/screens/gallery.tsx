import type { Route } from "./+types/gallery";

import { useEffect } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useNavigation,
  useRevalidator,
  useSearchParams,
} from "react-router";

import GalleryList from "../components/gallery-list";
import GallerySkeleton from "../components/gallery-skeleton";
import SearchForm from "../components/search-form";
import { galleryAction } from "../server/gallery.action";
import { galleryLoader } from "../server/gallery.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: "갤러리 페이지" }];
};

export const loader = galleryLoader;
export const action = galleryAction;

/** 상단 탭용 카테고리 설정 (slug → 표시명) */
const GALLERY_CATEGORIES = [
  { slug: "all", label: "All" },
  { slug: "design", label: "Design" },
  { slug: "publishing", label: "Publishing" },
  { slug: "development", label: "Development" },
] as const;

export default function Gallery({ loaderData }: Route.ComponentProps) {
  const {
    hasGalleryAccess,
    category,
    search,
    galleries,
    likedGalleries,
    savedGalleries,
    pagination,
  } = loaderData;

  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();

  // 갤러리 목록 로딩 중(카테고리/검색/페이지 변경)일 때만 스켈레톤 표시
  const isLoadingGallery =
    navigation.state === "loading" &&
    navigation.location?.pathname === "/gallery";

  // 상세 페이지에서 목록으로 돌아올 때, 카운트가 즉시 반영되도록 목록 로더를 1회 재검증
  useEffect(() => {
    const state = location.state as { revalidateGalleryList?: boolean } | null;
    if (!state?.revalidateGalleryList) return;

    revalidator.revalidate();
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [
    location.state,
    location.pathname,
    location.search,
    navigate,
    revalidator,
  ]);

  // 로딩 중이면 스켈레톤 표시 (다른 경로로 나가는 중일 때는 스켈레톤 미표시)
  if (isLoadingGallery) {
    return <GallerySkeleton />;
  }

  // 권한이 없으면 지정 문구로 차단 화면 노출
  if (!hasGalleryAccess) {
    return (
      <div className="mx-auto w-full max-w-[1680px] px-5 py-24 xl:py-40">
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
          <h1 className="text-h5 xl:text-h4">
            이 콘텐츠는 승인된 회원만 열람할 수 있습니다
          </h1>
          <p className="text-text-2/70 max-w-[780px] text-base xl:text-lg">
            갤러리 접근 권한이 아직 활성화되지 않았습니다. 권한 신청 후 승인이
            완료되면 바로 이용하실 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-2 xl:py-10">
      <div className="flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-center">
        {/* 카테고리 탭: 현재 선택값과 일치하면 밑줄 표시 */}
        <ul className="xl:text-h6 order-2 flex items-center gap-10 xl:order-1">
          {GALLERY_CATEGORIES.map(({ slug, label }) => {
            const isActive = (category ?? "all") === slug;

            // 카테고리 탭 클릭 시: 해당 카테고리만 적용하고 검색·페이지는 제거
            const params = new URLSearchParams();
            params.set("category", slug);
            const to = `/gallery?${params.toString()}`;

            return (
              <li key={slug} className="relative">
                <Link
                  to={to}
                  className={
                    isActive
                      ? undefined
                      : "text-text-2/60 hover:text-text-2 font-light"
                  }
                >
                  {label}
                </Link>
                {isActive && (
                  <div className="bg-primary absolute -bottom-2 left-0 h-1 w-full" />
                )}
              </li>
            );
          })}
        </ul>

        {/* 클래스 페이지와 동일 디자인의 검색 UI */}
        <SearchForm category={category} search={search} />
      </div>

      <div className="text-text-2/60 pt-10 pb-4 text-xs xl:pt-14 xl:text-sm">
        이 작업물들은 학생들의 포트폴리오로, 교육적 목적으로 제작되었으며 상업적
        이득을 취하지 않습니다
      </div>

      {/* 실제 DB 갤러리 목록 + 페이지네이션 */}
      <GalleryList
        galleries={galleries}
        likedGalleries={likedGalleries}
        savedGalleries={savedGalleries}
        pagination={pagination}
        category={category}
        search={search}
        categoryLabel={
          GALLERY_CATEGORIES.find((c) => c.slug === (category ?? "all"))
            ?.label ?? "All"
        }
      />
    </div>
  );
}

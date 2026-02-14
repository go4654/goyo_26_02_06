import type { Route } from "../screens/+types/gallery";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getGalleries } from "../queries";

/** 페이지당 표시할 갤러리 수 (클래스와 동일한 그리드 느낌 유지) */
const DEFAULT_PAGE_SIZE = 12;

/** 쿼리 파라미터에 카테고리가 없을 때 사용하는 기본값 */
const DEFAULT_CATEGORY = "all";

/**
 * 갤러리 목록 페이지 로더
 *
 * - 인증 확인
 * - 갤러리 접근 권한(gallery_access) 확인
 * - URL 쿼리: category, page, search 파싱
 * - getGalleries로 페이지네이션·카테고리 필터 적용 후 반환
 */
export async function galleryLoader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  // 추가 접근 제어: gallery_access 허용 유저(또는 관리자)만 갤러리 열람 가능
  const {
    data: { user },
  } = await client.auth.getUser();

  const { data: profile, error: profileError } = user
    ? await client
        .from("profiles")
        .select("role, gallery_access")
        .eq("profile_id", user.id)
        .single()
    : { data: null, error: null };

  const isAdmin = profile?.role === "admin";
  const hasGalleryAccess = Boolean(profile?.gallery_access) || isAdmin;

  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? DEFAULT_CATEGORY;
  const search = url.searchParams.get("search");
  const pageParam = url.searchParams.get("page");
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  // 프로필 조회 실패 또는 접근 불가 시: 목록 쿼리를 실행하지 않고 화면에서 안내 문구 처리
  if (profileError || !hasGalleryAccess) {
    return {
      hasGalleryAccess: false,
      category,
      search: search || null,
      galleries: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        pageSize: DEFAULT_PAGE_SIZE,
      },
    };
  }

  const result = await getGalleries(client, {
    category: category || DEFAULT_CATEGORY,
    search: search || null,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  return {
    hasGalleryAccess: true,
    category,
    search: search || null,
    galleries: result.galleries,
    pagination: {
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalCount: result.totalCount,
      pageSize: result.pageSize,
    },
  };
}

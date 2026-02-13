import type { Route } from "../screens/+types/class";

import { redirect } from "react-router";

import { getUserRole } from "~/core/lib/guards.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  getClasses,
  getUserLikedClasses,
  getUserSavedClasses,
} from "../queries";

/**
 * 페이지당 표시할 클래스 수
 */
const DEFAULT_PAGE_SIZE = 12;

/**
 * 기본 카테고리 (카테고리가 없을 때 리다이렉트)
 */
const DEFAULT_CATEGORY = "figma";

/**
 * 클래스 페이지 로더
 *
 * 기능:
 * - 인증 확인
 * - 카테고리 파라미터 처리 (없으면 기본 카테고리로 리다이렉트)
 * - 페이지네이션 처리
 * - 실제 데이터베이스에서 클래스 목록 조회
 */
export const classLoader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const pageParam = url.searchParams.get("page");
  const search = url.searchParams.get("search");

  // 검색어가 없을 때만 카테고리가 필수 (검색어가 있으면 카테고리 무시)
  if (!search && !category) {
    throw redirect(`/class?category=${DEFAULT_CATEGORY}`);
  }

  // 페이지 번호 파싱 (기본값: 1)
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  // 클래스 목록 조회
  // 검색어가 있으면 카테고리 필터를 무시하고 전체 클래스에서 검색
  const result = await getClasses(client, {
    category: search ? null : category, // 검색어가 있으면 카테고리 무시
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    search: search || null,
  });

  // 현재 사용자 정보 조회
  const { user } = await getUserRole(client);
  const userId = user?.id || null;

  // 사용자가 좋아요/저장한 클래스 ID 목록 조회
  const [likedClasses, savedClasses] = await Promise.all([
    getUserLikedClasses(client, userId),
    getUserSavedClasses(client, userId),
  ]);

  return {
    category,
    classes: result.classes,
    pagination: {
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalCount: result.totalCount,
      pageSize: result.pageSize,
    },
    search: search || null,
    likedClasses: Array.from(likedClasses),
    savedClasses: Array.from(savedClasses),
  };
};

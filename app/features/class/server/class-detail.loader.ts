import type { Route } from "../screens/+types/class-detail";

import { bundleMDX } from "mdx-bundler";
import rehypePrettyCode from "rehype-pretty-code";

import { getUserRole, requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { logger } from "~/core/utils/logger";

import { COMMENTS_PAGE_SIZE } from "../constants/comment.constants";
import {
  getClassBySlug,
  getClassCommentsPage,
  getClassNavigation,
  getUserClassStatus,
  incrementClassView,
} from "../queries";

/**
 * 클래스 상세 페이지 로더
 *
 * 기능:
 * - 인증 확인
 * - slug 기반 클래스 상세 정보 조회
 * - MDX 콘텐츠 번들링
 * - 조회수 증가 (트리거에 의해 자동 처리)
 * - 이전/다음 클래스 정보 조회
 */
export async function classDetailLoader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const { slug } = params;

  if (!slug) {
    throw new Response("클래스를 찾을 수 없습니다.", { status: 404 });
  }

  // 현재 사용자 정보 및 관리자 권한 조회
  const { user, isAdmin } = await getUserRole(client);
  const userId = user?.id || null;

  // 클래스 상세 정보 조회와 병렬로 실행 가능한 작업들 시작
  const classDetailPromise = getClassBySlug(client, slug);

  // 클래스 상세 정보 조회 완료 대기
  const classDetail = await classDetailPromise;

  // 좋아요/저장 카운트, 사용자 상태, 조회수 증가, 네비게이션, 댓글을 병렬로 조회
  // (MDX 번들링은 별도로 처리 - CPU 집약적 작업)
  const [countsResult, userStatus, navigation, commentsPage] =
    await Promise.all([
      // 좋아요/저장 카운트는 denormalized 컬럼에만 의존하지 않고 실제 레코드 수로 계산
      Promise.all([
        client
          .from("class_likes")
          .select("id", { count: "exact", head: true })
          .eq("class_id", classDetail.id)
          .then((r) => ({ count: r.count ?? 0, error: r.error })),
        client
          .from("class_saves")
          .select("id", { count: "exact", head: true })
          .eq("class_id", classDetail.id)
          .then((r) => ({ count: r.count ?? 0, error: r.error })),
      ]).catch((error) => {
        logger.error("좋아요/저장 카운트 계산 실패:", error);
        return [
          { count: 0, error: null },
          { count: 0, error: null },
        ];
      }),
      // 사용자의 좋아요/저장 상태 확인 (해당 클래스만)
      getUserClassStatus(client, classDetail.id, userId),
      // 이전/다음 클래스 조회
      getClassNavigation(client, slug, classDetail.category),
      // 댓글 목록 첫 페이지 조회 (최상위 댓글 기준)
      getClassCommentsPage(client, classDetail.id, userId, {
        limit: COMMENTS_PAGE_SIZE,
        offset: 0,
        sortOrder: "latest",
      }),
    ]);

  // 조회수 증가 (트리거에 의해 자동으로 view_count 증가)
  // 에러가 발생해도 페이지는 표시되도록 try-catch 처리 (병렬 실행)
  incrementClassView(client, classDetail.id, userId).catch((error) => {
    logger.error("조회수 증가 실패:", error);
  });

  // 카운트 결과 처리
  const [likeCountResult, saveCountResult] = countsResult;
  const classDetailWithCounts = {
    ...classDetail,
    like_count: likeCountResult.count,
    save_count: saveCountResult.count,
  };

  // MDX 콘텐츠 번들링 (CPU 집약적 작업이므로 별도 처리)
  const { code } = await bundleMDX({
    source: classDetail.content_mdx,
    mdxOptions(options) {
      options.remarkPlugins = [...(options.remarkPlugins ?? [])];
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        [rehypePrettyCode, { theme: "github-dark" }],
      ];
      return options;
    },
  });

  return {
    class: classDetailWithCounts,
    code,
    navigation,
    comments: commentsPage.comments,
    totalTopLevelComments: commentsPage.totalTopLevel,
    currentUserId: userId,
    isAdmin,
    isLiked: userStatus.isLiked,
    isSaved: userStatus.isSaved,
  };
}

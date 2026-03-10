import type { Route } from "../screens/+types/class-detail";

import { bundleMDX } from "mdx-bundler";
import rehypePrettyCode from "rehype-pretty-code";

import { getUserRole } from "~/core/lib/guards.server";
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
 * - slug 기반 클래스 상세 정보 조회
 * - MDX 콘텐츠 번들링
 * - 조회수 증가 (트리거에 의해 자동 처리)
 * - 이전/다음 클래스 정보 조회
 */
export async function classDetailLoader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const { slug } = params;

  if (!slug) {
    throw new Response("클래스를 찾을 수 없습니다.", { status: 404 });
  }

  // 현재 사용자 정보 및 관리자 권한 조회 (비로그인 허용)
  const { user, isAdmin } = await getUserRole(client);
  const userId = user?.id || null;
  const isAuthenticated = !!userId;

  // 클래스 상세 정보 조회와 병렬로 실행 가능한 작업들 시작
  const classDetailPromise = getClassBySlug(client, slug);

  // 클래스 상세 정보 조회 완료 대기
  const classDetail = await classDetailPromise;

  // 좋아요/저장 상태, 조회수 증가, 네비게이션, 댓글을 병렬로 조회
  // (MDX 번들링은 별도로 처리 - CPU 집약적 작업)
  const [userStatus, navigation] = await Promise.all([
    // 사용자의 좋아요/저장 상태 확인 (해당 클래스만)
    getUserClassStatus(client, classDetail.id, userId),
    // 이전/다음 클래스 조회
    getClassNavigation(client, slug, classDetail.category),
  ]);

  // 댓글 데이터는 로그인 사용자에게만 로드
  const commentsPage = isAuthenticated
    ? await getClassCommentsPage(client, classDetail.id, userId, {
        limit: COMMENTS_PAGE_SIZE,
        offset: 0,
        sortOrder: "latest",
      })
    : { comments: [], totalTopLevel: 0 };

  // 조회수 증가 (트리거에 의해 자동으로 view_count 증가)
  // 에러가 발생해도 페이지는 표시되도록 try-catch 처리 (병렬 실행)
  incrementClassView(client, classDetail.id, userId).catch((error) => {
    logger.error("조회수 증가 실패:", error);
  });

  // MDX 콘텐츠 번들링 (CPU 집약적 작업이므로 별도 처리)
  // 비로그인 사용자는 원본 MDX가 클라이언트로 전달되지 않도록 항상 안전한 기본 코드 사용
  // 번들 실패 시에도 상세 에러 메시지가 클라이언트에 노출되지 않도록 서버 로그에만 기록
  let code = "export default function MDXContent(){return null;}"; // 안전한 기본 코드
  let hasMdxError = false;

  if (isAuthenticated) {
    try {
      const result = await bundleMDX({
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
      code = result.code;
    } catch (error) {
      logger.error("클래스 MDX 번들링 실패:", error);
      hasMdxError = true;
    }
  }

  // 비로그인 사용자를 위한 더미 프리뷰 텍스트 (실제 MDX 내용은 포함하지 않음)
  let previewText: string | null = null;
  if (!isAuthenticated) {
    previewText = `${classDetail.title}

이 클래스는 고요 스튜디오에서 준비한 심화 학습 콘텐츠입니다.
학습 흐름, 실전 예제, 체크리스트 등 핵심 내용이 단계적으로 정리되어 있으며
로그인 후 전체 본문을 통해 상세한 설명과 예시를 모두 확인하실 수 있습니다.`;
  }

  return {
    class: classDetail,
    code,
    hasMdxError,
    navigation,
    comments: commentsPage.comments,
    totalTopLevelComments: commentsPage.totalTopLevel,
    currentUserId: userId,
    isAdmin,
    isLiked: userStatus.isLiked,
    isSaved: userStatus.isSaved,
    isAuthenticated,
    previewText,
  };
}

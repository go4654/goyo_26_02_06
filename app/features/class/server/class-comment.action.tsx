import { data, redirect } from "react-router";
import type { Route } from "../screens/+types/class-detail";

import { getUserRole } from "~/core/lib/guards.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  createComment,
  deleteComment,
  toggleClassLike,
  toggleClassSave,
  toggleCommentLike,
  toggleCommentVisibility,
  updateComment,
} from "../mutation";

/**
 * 댓글 액션 타입
 */
type CommentAction =
  | "create"
  | "update"
  | "delete"
  | "toggleLike"
  | "toggleVisibility"
  | "toggleClassLike"
  | "toggleClassSave";

function getClassDetailRedirectPath(slug: string) {
  // Location 헤더는 ByteString(ASCII)이어야 하므로 path segment를 인코딩합니다.
  return `/class/${encodeURIComponent(slug)}`;
}

/**
 * 클래스 댓글 액션 핸들러
 *
 * 댓글 생성, 수정, 삭제를 처리합니다.
 * RLS 정책에 따라 권한이 자동으로 검증됩니다.
 *
 * 지원하는 액션:
 * - create: 새 댓글 생성
 * - update: 댓글 수정
 * - delete: 댓글 삭제 (hard delete)
 */
export async function classCommentAction({
  request,
  params,
}: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const { slug } = params;
  if (!slug) {
    return data({ error: "클래스를 찾을 수 없습니다." }, { status: 404 });
  }

  // React Router가 params를 디코딩하므로 사람이 읽는 slug(한글/공백 포함)일 수 있습니다.
  // redirect의 Location은 ASCII여야 하므로 아래 helper를 통해 인코딩된 경로를 사용합니다.
  const redirectPath = getClassDetailRedirectPath(slug);

  // 현재 사용자 정보 및 관리자 권한 조회
  const { user, isAdmin } = await getUserRole(client);
  if (!user) {
    return data({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const formData = await request.formData();
  const action = formData.get("action") as CommentAction;
  const classId = formData.get("classId") as string;
  const commentId = formData.get("commentId") as string | null;
  const content = formData.get("content") as string | null;
  const parentId = formData.get("parentId") as string | null;

  try {
    switch (action) {
      case "create": {
        if (!content || !classId) {
          return data(
            { error: "댓글 내용과 클래스 ID가 필요합니다." },
            { status: 400 },
          );
        }

        await createComment(
          client,
          classId,
          user.id,
          content.trim(),
          parentId || null,
        );

        // 성공 시 현재 페이지로 리다이렉트 (댓글 목록 새로고침)
        throw redirect(redirectPath, { status: 303 });
      }

      case "update": {
        if (!commentId || !content) {
          return data(
            { error: "댓글 ID와 내용이 필요합니다." },
            { status: 400 },
          );
        }

        await updateComment(client, commentId, user.id, content.trim());

        // 성공 시 현재 페이지로 리다이렉트 (댓글 목록 새로고침)
        throw redirect(redirectPath, { status: 303 });
      }

      case "delete": {
        if (!commentId) {
          return data({ error: "댓글 ID가 필요합니다." }, { status: 400 });
        }

        try {
          // 권한은 RLS에서 검증됩니다. (작성자 또는 관리자)
          await deleteComment(client, commentId);
        } catch (deleteError) {
          // 삭제 실패 시 에러 반환
          const errorMessage =
            deleteError instanceof Error
              ? deleteError.message
              : "댓글 삭제에 실패했습니다.";
          return data({ error: errorMessage }, { status: 500 });
        }

        // 성공 시 현재 페이지로 리다이렉트 (댓글 목록 새로고침)
        throw redirect(redirectPath, { status: 303 });
      }

      case "toggleLike": {
        if (!commentId) {
          return data({ error: "댓글 ID가 필요합니다." }, { status: 400 });
        }

        const isLiked = await toggleCommentLike(client, commentId, user.id);

        // 좋아요는 페이지 리다이렉트 없이 결과만 반환 (UX 향상)
        return data({ success: true, isLiked }, { status: 200 });
      }

      case "toggleVisibility": {
        if (!commentId) {
          return data(
            { success: false, error: "댓글 ID가 필요합니다." },
            { status: 400 },
          );
        }
        if (!isAdmin) {
          return data(
            { success: false, error: "권한이 없습니다." },
            { status: 403 },
          );
        }

        try {
          await toggleCommentVisibility(client, commentId);
          return data({ success: true }, { status: 200 });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "가시성 변경에 실패했습니다.";
          return data({ success: false, error: message }, { status: 400 });
        }
      }

      case "toggleClassLike": {
        if (!classId) {
          return data({ error: "클래스 ID가 필요합니다." }, { status: 400 });
        }

        const isLiked = await toggleClassLike(client, classId, user.id);

        // 업데이트된 좋아요 카운트 조회 (classes.like_count 트리거에 의존하지 않고 실제 레코드 수로 계산)
        const { count: likeCount, error: likeCountError } = await client
          .from("class_likes")
          .select("id", { count: "exact", head: true })
          .eq("class_id", classId);
        if (likeCountError) {
          throw likeCountError;
        }

        return data(
          {
            success: true,
            isLiked,
            likeCount: likeCount ?? 0,
          },
          { status: 200 },
        );
      }

      case "toggleClassSave": {
        if (!classId) {
          return data({ error: "클래스 ID가 필요합니다." }, { status: 400 });
        }

        const isSaved = await toggleClassSave(client, classId, user.id);

        // 업데이트된 저장 카운트 조회 (classes.save_count 트리거에 의존하지 않고 실제 레코드 수로 계산)
        const { count: saveCount, error: saveCountError } = await client
          .from("class_saves")
          .select("id", { count: "exact", head: true })
          .eq("class_id", classId);
        if (saveCountError) {
          throw saveCountError;
        }

        return data(
          {
            success: true,
            isSaved,
            saveCount: saveCount ?? 0,
          },
          { status: 200 },
        );
      }

      default:
        return data({ error: "지원하지 않는 액션입니다." }, { status: 400 });
    }
  } catch (error) {
    // redirect는 throw되므로 다시 throw
    if (error instanceof Response) {
      throw error;
    }
    
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return data({ error: errorMessage }, { status: 500 });
  }
}

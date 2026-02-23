import type { Route } from "../+types/admin-comments";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

type ActionBody =
  | {
      operation: "toggle_visibility";
      commentIds: string[];
    }
  | {
      operation: "delete";
      commentIds: string[];
    };

/**
 * 댓글 관리 액션
 *
 * - toggle_visibility: is_visible 토글
 * - delete: 하드 삭제 (DB에서 행 제거, 대댓글은 자식 먼저 삭제 후 부모 삭제)
 */
export async function commentsAction({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return { error: "요청 본문을 읽을 수 없습니다." };
  }

  // 가시성 토글
  if (body.operation === "toggle_visibility") {
    const { commentIds } = body;

    if (!commentIds || commentIds.length === 0) {
      return { error: "댓글 ID가 제공되지 않았습니다." };
    }

    // 현재 상태 조회
    const { data: currentData } = await client
      .from("class_comments")
      .select("id, is_visible")
      .in("id", commentIds);

    if (!currentData || currentData.length === 0) {
      return { error: "댓글을 찾을 수 없습니다." };
    }

    // 각 댓글의 is_visible을 반대로 변경
    const updates = currentData.map((comment) =>
      client
        .from("class_comments")
        .update({ is_visible: !comment.is_visible })
        .eq("id", comment.id),
    );

    const results = await Promise.allSettled(updates);

    const failed: Array<{ commentId: string; error: string }> = [];
    let successCount = 0;
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        failed.push({
          commentId: commentIds[i],
          error: r.reason?.message ?? String(r.reason),
        });
      } else if (r.value?.error) {
        failed.push({
          commentId: commentIds[i],
          error: r.value.error.message,
        });
      } else {
        successCount += 1;
      }
    });

    return {
      success: true,
      operation: "toggle_visibility",
      count: successCount,
      failed: failed.length > 0 ? failed : undefined,
    };
  }

  // 하드 삭제 (auth 1회만 사용, 삭제는 배치 2회: 자식 → 부모)
  if (body.operation === "delete") {
    const { commentIds } = body;

    if (!commentIds || commentIds.length === 0) {
      return { error: "댓글 ID가 제공되지 않았습니다." };
    }

    const idSet = new Set(commentIds);

    const { data: rows } = await client
      .from("class_comments")
      .select("id, parent_id")
      .in("id", commentIds);

    if (!rows || rows.length === 0) {
      return { error: "삭제할 댓글을 찾을 수 없거나 권한이 없습니다." };
    }

    const childIds = rows
      .filter(
        (r) =>
          r.parent_id != null && idSet.has(r.parent_id as string),
      )
      .map((r) => r.id);
    const parentOrStandaloneIds = commentIds.filter((id) => !childIds.includes(id));

    const failed: Array<{ commentId: string; error: string }> = [];
    let successCount = 0;

    if (childIds.length > 0) {
      const { error } = await client
        .from("class_comments")
        .delete()
        .in("id", childIds);
      if (error) {
        failed.push({ commentId: childIds[0], error: `자식 댓글 삭제 실패: ${error.message}` });
      } else {
        successCount += childIds.length;
      }
    }

    if (parentOrStandaloneIds.length > 0) {
      const { error } = await client
        .from("class_comments")
        .delete()
        .in("id", parentOrStandaloneIds);
      if (error) {
        failed.push({
          commentId: parentOrStandaloneIds[0],
          error: `댓글 삭제 실패: ${error.message}`,
        });
      } else {
        successCount += parentOrStandaloneIds.length;
      }
    }

    return {
      success: true,
      operation: "delete",
      count: successCount,
      failed: failed.length > 0 ? failed : undefined,
    };
  }

  return { error: "알 수 없는 작업입니다." };
}

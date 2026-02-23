/**
 * 클래스 데이터베이스 mutation 함수
 *
 * 이 파일은 classes 테이블과 관련된 데이터 변경 작업(생성, 수정, 삭제)을 처리하는 함수들을 제공합니다.
 * 조회 작업은 queries.ts에 있습니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "~/core/utils/logger";

/**
 * 댓글 생성
 *
 * 새로운 댓글을 생성합니다.
 * 트리거에 의해 자동으로 comment_count가 증가합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param classId - 클래스 ID
 * @param userId - 사용자 ID
 * @param content - 댓글 내용
 * @param parentId - 부모 댓글 ID (대댓글인 경우)
 */
export async function createComment(
  client: SupabaseClient,
  classId: string,
  userId: string,
  content: string,
  parentId: string | null = null,
): Promise<void> {
  const { error } = await client.from("class_comments").insert({
    class_id: classId,
    user_id: userId,
    content,
    parent_id: parentId,
  });

  if (error) {
    logger.error(
      "[createComment] Supabase error:",
      error.message,
      error.details,
    );
    throw new Error("댓글 등록에 실패했습니다.");
  }
}

/**
 * 댓글 수정
 *
 * 댓글 내용을 수정합니다.
 * RLS 정책에 의해 본인 댓글만 수정 가능합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param commentId - 댓글 ID
 * @param userId - 사용자 ID (권한 확인용)
 * @param content - 수정할 댓글 내용
 */
export async function updateComment(
  client: SupabaseClient,
  commentId: string,
  userId: string,
  content: string,
): Promise<void> {
  const { error } = await client
    .from("class_comments")
    .update({ content })
    .eq("id", commentId)
    .eq("user_id", userId);

  if (error) {
    logger.error(
      "[updateComment] Supabase error:",
      error.message,
      error.details,
    );
    throw new Error("댓글 수정에 실패했습니다.");
  }
}

/**
 * 댓글 숨김 토글 (관리자 전용)
 *
 * is_visible을 반대로 변경합니다. RLS 정책에 의해 관리자만 호출 가능해야 합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param commentId - 댓글 ID
 */
export async function toggleCommentVisibility(
  client: SupabaseClient,
  commentId: string,
): Promise<void> {
  const { data: row, error: fetchError } = await client
    .from("class_comments")
    .select("is_visible")
    .eq("id", commentId)
    .single();

  if (fetchError || !row) {
    logger.error("[toggleCommentVisibility] fetch error:", fetchError?.message);
    throw new Error("댓글을 찾을 수 없습니다.");
  }

  const { error: updateError } = await client
    .from("class_comments")
    .update({ is_visible: !row.is_visible })
    .eq("id", commentId);

  if (updateError) {
    logger.error(
      "[toggleCommentVisibility] update error:",
      updateError.message,
    );
    throw new Error("숨김 처리에 실패했습니다.");
  }
}

/**
 * 댓글 삭제 (hard delete)
 *
 * 댓글을 hard delete 처리합니다.
 * 트리거에 의해 자동으로 comment_count가 감소합니다. (AFTER DELETE)
 *
 * 권한은 RLS 정책으로 강제됩니다:
 * - 일반 사용자: 본인 댓글 삭제 가능
 * - 관리자: 모든 댓글 삭제 가능
 *
 * 주의:
 * - DB FK 설정에 따라 대댓글이 함께 삭제될 수 있습니다. (ON DELETE CASCADE)
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param commentId - 댓글 ID
 */
export async function deleteComment(
  client: SupabaseClient,
  commentId: string,
): Promise<void> {
  // RLS 정책이 자동으로 권한을 확인합니다. (DELETE policy)
  const { data, error } = await client
    .from("class_comments")
    .delete()
    .eq("id", commentId)
    .select("id");

  if (error) {
    logger.error(
      "[deleteComment] Supabase error:",
      error.message,
      error.details,
      error.hint,
    );
    throw new Error("댓글 삭제에 실패했습니다.");
  }

  // RLS로 인해 실제 삭제된 row가 없을 수도 있음
  if (!data || data.length === 0) {
    throw new Error("댓글을 삭제할 권한이 없거나 댓글을 찾을 수 없습니다.");
  }
}

/**
 * 댓글 좋아요 토글
 *
 * 사용자가 댓글에 좋아요를 누르거나 취소합니다.
 * 이미 좋아요를 누른 경우 좋아요를 취소하고,
 * 좋아요를 누르지 않은 경우 좋아요를 추가합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param commentId - 댓글 ID
 * @param userId - 사용자 ID
 * @returns 좋아요 추가 여부 (true: 추가, false: 취소)
 */
export async function toggleCommentLike(
  client: SupabaseClient,
  commentId: string,
  userId: string,
): Promise<boolean> {
  // 기존 좋아요 확인
  const { data: existingLike } = await client
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingLike) {
    // 좋아요 취소
    const { error } = await client
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);

    if (error) {
      logger.error(
        "[toggleCommentLike] cancel error:",
        error.message,
        error.details,
      );
      throw new Error("좋아요 취소에 실패했습니다.");
    }

    return false;
  } else {
    // 좋아요 추가
    const { error } = await client.from("comment_likes").insert({
      comment_id: commentId,
      user_id: userId,
    });

    if (error) {
      logger.error(
        "[toggleCommentLike] add error:",
        error.message,
        error.details,
      );
      throw new Error("좋아요 등록에 실패했습니다.");
    }

    return true;
  }
}

/**
 * 클래스 좋아요 토글
 *
 * 사용자가 클래스에 좋아요를 누르거나 취소합니다.
 * 이미 좋아요를 누른 경우 좋아요를 취소하고,
 * 좋아요를 누르지 않은 경우 좋아요를 추가합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param classId - 클래스 ID
 * @param userId - 사용자 ID
 * @returns 좋아요 추가 여부 (true: 추가, false: 취소)
 */
export async function toggleClassLike(
  client: SupabaseClient,
  classId: string,
  userId: string,
): Promise<boolean> {
  // 기존 좋아요 확인
  const { data: existingLike } = await client
    .from("class_likes")
    .select("id")
    .eq("class_id", classId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingLike) {
    // 좋아요 취소
    const { error } = await client
      .from("class_likes")
      .delete()
      .eq("class_id", classId)
      .eq("user_id", userId);

    if (error) {
      logger.error(
        "[toggleClassLike] cancel error:",
        error.message,
        error.details,
      );
      throw new Error("좋아요 취소에 실패했습니다.");
    }

    return false;
  } else {
    // 좋아요 추가
    const { error } = await client.from("class_likes").insert({
      class_id: classId,
      user_id: userId,
    });

    if (error) {
      logger.error(
        "[toggleClassLike] add error:",
        error.message,
        error.details,
      );
      throw new Error("좋아요 등록에 실패했습니다.");
    }

    return true;
  }
}

/**
 * 클래스 저장 토글
 *
 * 사용자가 클래스를 저장하거나 저장 취소합니다.
 * 이미 저장한 경우 저장을 취소하고,
 * 저장하지 않은 경우 저장을 추가합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param classId - 클래스 ID
 * @param userId - 사용자 ID
 * @returns 저장 추가 여부 (true: 추가, false: 취소)
 */
export async function toggleClassSave(
  client: SupabaseClient,
  classId: string,
  userId: string,
): Promise<boolean> {
  // 기존 저장 확인
  const { data: existingSave } = await client
    .from("class_saves")
    .select("id")
    .eq("class_id", classId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingSave) {
    // 저장 취소
    const { error } = await client
      .from("class_saves")
      .delete()
      .eq("class_id", classId)
      .eq("user_id", userId);

    if (error) {
      logger.error(
        "[toggleClassSave] cancel error:",
        error.message,
        error.details,
      );
      throw new Error("저장 취소에 실패했습니다.");
    }

    return false;
  } else {
    // 저장 추가
    const { error } = await client.from("class_saves").insert({
      class_id: classId,
      user_id: userId,
    });

    if (error) {
      logger.error(
        "[toggleClassSave] add error:",
        error.message,
        error.details,
      );
      throw new Error("저장 등록에 실패했습니다.");
    }

    return true;
  }
}

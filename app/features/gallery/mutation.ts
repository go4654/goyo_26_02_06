/**
 * 갤러리 데이터베이스 mutation 함수
 *
 * - 갤러리 좋아요/저장 토글과 같은 "변경" 로직을 한 곳에 모아
 *   목록(/gallery)과 상세(/gallery/:slug) 액션에서 재사용합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "~/core/utils/logger";

/**
 * 갤러리 좋아요 토글
 *
 * @returns true: 좋아요 추가, false: 좋아요 취소
 */
export async function toggleGalleryLike(
  client: SupabaseClient,
  galleryId: string,
  userId: string,
): Promise<boolean> {
  const { data: existingLike } = await client
    .from("gallery_likes")
    .select("id")
    .eq("gallery_id", galleryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingLike) {
    const { error } = await client
      .from("gallery_likes")
      .delete()
      .eq("gallery_id", galleryId)
      .eq("user_id", userId);
    if (error) {
      logger.error("[toggleGalleryLike] cancel error:", error.message);
      throw new Error("좋아요 취소에 실패했습니다.");
    }
    return false;
  }

  const { error } = await client.from("gallery_likes").insert({
    gallery_id: galleryId,
    user_id: userId,
  });
  if (error) {
    logger.error("[toggleGalleryLike] add error:", error.message);
    throw new Error("좋아요 등록에 실패했습니다.");
  }
  return true;
}

/**
 * 갤러리 저장 토글
 *
 * @returns true: 저장 추가, false: 저장 취소
 */
export async function toggleGallerySave(
  client: SupabaseClient,
  galleryId: string,
  userId: string,
): Promise<boolean> {
  const { data: existingSave } = await client
    .from("gallery_saves")
    .select("id")
    .eq("gallery_id", galleryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingSave) {
    const { error } = await client
      .from("gallery_saves")
      .delete()
      .eq("gallery_id", galleryId)
      .eq("user_id", userId);
    if (error) {
      logger.error("[toggleGallerySave] cancel error:", error.message);
      throw new Error("저장 취소에 실패했습니다.");
    }
    return false;
  }

  const { error } = await client.from("gallery_saves").insert({
    gallery_id: galleryId,
    user_id: userId,
  });
  if (error) {
    logger.error("[toggleGallerySave] add error:", error.message);
    throw new Error("저장 등록에 실패했습니다.");
  }
  return true;
}


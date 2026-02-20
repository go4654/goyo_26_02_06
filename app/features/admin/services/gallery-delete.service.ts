/**
 * 갤러리 삭제 서비스
 * 갤러리 하드 삭제 비즈니스 로직 (Storage → DB 순서, Storage 실패 시 DB 삭제 중단)
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import { deleteGalleryStorageFolder } from "../utils/storage-utils";

export interface GalleryDeleteResult {
  galleryId: string;
  success: boolean;
  error?: string;
}

async function checkGalleryExists(
  client: SupabaseClient<Database>,
  galleryId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("galleries")
    .select("id")
    .eq("id", galleryId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * 단일 갤러리 삭제.
 * Storage 삭제 → DB 삭제 순서. Storage 실패 시 DB 삭제 진행하지 않음.
 */
export async function deleteGallery(
  client: SupabaseClient<Database>,
  galleryId: string,
): Promise<GalleryDeleteResult> {
  const exists = await checkGalleryExists(client, galleryId);
  if (!exists) {
    return {
      galleryId,
      success: false,
      error: "갤러리를 찾을 수 없습니다.",
    };
  }

  try {
    await deleteGalleryStorageFolder(client, galleryId);
  } catch (storageError) {
    const errorMessage =
      storageError instanceof Error
        ? storageError.message
        : "Storage deletion failed. Database deletion aborted.";
    return {
      galleryId,
      success: false,
      error: errorMessage,
    };
  }

  const { error: deleteError } = await client
    .from("galleries")
    .delete()
    .eq("id", galleryId);

  if (deleteError) {
    return {
      galleryId,
      success: false,
      error: `DB 삭제 실패: ${deleteError.message}`,
    };
  }

  return {
    galleryId,
    success: true,
  };
}

/**
 * 여러 갤러리 삭제. 항목별로 독립 처리.
 */
export async function deleteGalleries(
  client: SupabaseClient<Database>,
  galleryIds: string[],
): Promise<GalleryDeleteResult[]> {
  const results: GalleryDeleteResult[] = [];

  for (const galleryId of galleryIds) {
    const result = await deleteGallery(client, galleryId);
    results.push(result);
  }

  return results;
}

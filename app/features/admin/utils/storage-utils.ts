/**
 * Supabase Storage 업로드 유틸리티
 * 서버 사이드에서 사용됩니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/**
 * File 객체를 Buffer로 변환합니다.
 * Remix/Node 환경에서 File 객체는 직접 업로드할 수 없으므로 Buffer로 변환합니다.
 */
async function fileToBuffer(file: File | Blob): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Supabase Storage에 파일을 업로드합니다.
 *
 * @param client - Supabase 클라이언트
 * @param bucket - 버킷 이름
 * @param filePath - 저장 경로 (예: "classId/thumbnail.webp")
 * @param file - 업로드할 파일
 * @returns 공개 URL
 */
export async function uploadToStorage(
  client: SupabaseClient<Database>,
  bucket: string,
  filePath: string,
  file: File | Blob,
): Promise<string> {
  const uploadData = await fileToBuffer(file);

  const { error } = await client.storage
    .from(bucket)
    .upload(filePath, uploadData, {
      upsert: true,
      contentType: "image/webp",
    });

  if (error) {
    throw new Error(`파일 업로드 실패: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = client.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * @deprecated 호환성을 위해 유지. uploadToStorage를 사용하세요.
 */
export async function uploadThumbnailImage(
  client: SupabaseClient<Database>,
  classId: string,
  imageFile: File | Blob,
): Promise<string> {
  return uploadToStorage(client, "class", `${classId}/thumbnail.webp`, imageFile);
}

/**
 * @deprecated 호환성을 위해 유지. uploadToStorage를 사용하세요.
 */
export async function uploadContentImage(
  client: SupabaseClient<Database>,
  classId: string,
  imageFile: File | Blob,
  imageId: string,
): Promise<string> {
  return uploadToStorage(client, "class", `${classId}/content/${imageId}.webp`, imageFile);
}

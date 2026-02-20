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

/**
 * Supabase Storage 공개 URL에서 버킷 내 저장 경로 추출
 * 예: .../object/public/class/classId/content/abc.webp → classId/content/abc.webp
 *
 * @param bucket - 버킷 이름
 * @param publicUrl - getPublicUrl로 얻은 공개 URL
 * @returns 경로 또는 null (패턴 불일치 시)
 */
export function getStoragePathFromPublicUrl(
  bucket: string,
  publicUrl: string,
): string | null {
  const segment = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(segment);
  if (idx === -1) return null;
  const path = publicUrl.slice(idx + segment.length).split("?")[0].trim();
  return path || null;
}

/**
 * Storage에서 지정 경로들의 파일만 삭제
 * 다른 클래스 경로 삭제 방지를 위해 paths 검증은 호출부에서 수행할 것.
 *
 * @param client - Supabase 클라이언트
 * @param bucket - 버킷 이름
 * @param paths - 삭제할 파일 경로 배열 (버킷 기준 상대 경로)
 */
export async function removeStorageFiles(
  client: SupabaseClient<Database>,
  bucket: string,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;

  const { error } = await client.storage.from(bucket).remove(paths);

  if (error) {
    if (error.message.includes("not found")) {
      return;
    }
    throw new Error(`Storage 파일 삭제 실패: ${error.message}`);
  }
}

/**
 * 재귀적으로 모든 파일 경로를 수집합니다.
 */
async function collectAllFilePaths(
  client: SupabaseClient<Database>,
  bucket: string,
  folderPath: string,
  filePaths: string[] = [],
): Promise<string[]> {
  const { data: files, error } = await client.storage
    .from(bucket)
    .list(folderPath, {
      limit: 1000,
      offset: 0,
    });

  if (error) {
    // 폴더가 없거나 이미 삭제된 경우 빈 배열 반환
    if (error.message.includes("not found") || error.message.includes("404")) {
      return filePaths;
    }
    throw new Error(`Storage 파일 목록 조회 실패: ${error.message}`);
  }

  if (!files || files.length === 0) {
    return filePaths;
  }

  for (const file of files) {
    const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;

    // 파일인 경우 (id가 있으면 파일)
    if (file.id) {
      filePaths.push(filePath);
    } else {
      // 폴더인 경우 재귀적으로 처리
      await collectAllFilePaths(client, bucket, filePath, filePaths);
    }
  }

  return filePaths;
}

/**
 * 클래스의 Storage 폴더 전체를 삭제합니다.
 * class/{classId}/ 경로의 모든 파일을 재귀적으로 삭제합니다.
 *
 * @param client - Supabase 클라이언트
 * @param classId - 클래스 ID
 * @throws Storage 삭제 실패 시 에러를 throw합니다.
 */
export async function deleteClassStorageFolder(
  client: SupabaseClient<Database>,
  classId: string,
): Promise<void> {
  const folderPath = classId;

  // 모든 파일 경로 수집
  const filePaths = await collectAllFilePaths(
    client,
    "class",
    folderPath,
    [],
  );

  // 파일이 없는 경우는 정상 종료 (이미 삭제된 상태)
  if (filePaths.length === 0) {
    return;
  }

  // 모든 파일 삭제
  const { error: deleteError } = await client.storage
    .from("class")
    .remove(filePaths);

  if (deleteError) {
    // "not found" 에러는 이미 삭제된 것으로 간주하고 정상 처리
    if (deleteError.message.includes("not found")) {
      return;
    }
    // 그 외의 에러는 throw하여 호출부에서 처리하도록 함
    throw new Error(`Storage deletion failed. Database deletion aborted. ${deleteError.message}`);
  }
}

/** 갤러리 Storage 버킷 이름 */
const GALLERY_BUCKET = "gallery";

/**
 * 갤러리의 Storage 폴더 전체를 삭제합니다.
 * gallery/{galleryId}/ 경로의 모든 파일을 재귀적으로 삭제합니다.
 *
 * @param client - Supabase 클라이언트
 * @param galleryId - 갤러리 ID
 * @throws Storage 삭제 실패 시 에러를 throw (DB 삭제 중단)
 */
export async function deleteGalleryStorageFolder(
  client: SupabaseClient<Database>,
  galleryId: string,
): Promise<void> {
  const folderPath = galleryId;

  const filePaths = await collectAllFilePaths(
    client,
    GALLERY_BUCKET,
    folderPath,
    [],
  );

  if (filePaths.length === 0) {
    return;
  }

  const { error: deleteError } = await client.storage
    .from(GALLERY_BUCKET)
    .remove(filePaths);

  if (deleteError) {
    if (deleteError.message.includes("not found")) {
      return;
    }
    throw new Error(`Storage deletion failed. Database deletion aborted. ${deleteError.message}`);
  }
}

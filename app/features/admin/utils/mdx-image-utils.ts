/**
 * MDX 콘텐츠 이미지 URL 추출·비교·업로드·삭제 공통 유틸
 * 클래스/뉴스 등 버킷·리소스ID를 인자로 받아 재사용.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import {
  getStoragePathFromPublicUrl,
  removeStorageFiles,
  uploadToStorage,
} from "./storage-utils";

/**
 * URL이 해당 버킷·리소스의 content 이미지 경로인지 확인
 */
function isContentImageUrl(
  url: string,
  bucket: string,
  resourceId: string,
): boolean {
  return (
    url.includes(`/${bucket}/${resourceId}/content/`) && url.endsWith(".webp")
  );
}

/**
 * MDX 문자열에서 해당 리소스 소유 content 이미지 URL만 추출
 *
 * @param content - MDX 문자열
 * @param bucket - Storage 버킷 (class | news)
 * @param resourceId - 클래스/뉴스 ID
 */
export function extractMdxImageUrls(
  content: string,
  bucket: string,
  resourceId: string,
): string[] {
  if (!content?.trim() || !resourceId) {
    return [];
  }

  const urls: string[] = [];
  const mdImageRegex = /!\[[^\]]*\]\s*\(\s*([^)\s]+)\s*\)/g;
  let match = mdImageRegex.exec(content);
  while (match) {
    const url = match[1].trim();
    if (isContentImageUrl(url, bucket, resourceId)) urls.push(url);
    match = mdImageRegex.exec(content);
  }

  const imgSrcRegex = /<img[^>]+src\s*=\s*["']([^"']+)["']/gi;
  match = imgSrcRegex.exec(content);
  while (match) {
    const url = match[1].trim();
    if (isContentImageUrl(url, bucket, resourceId)) urls.push(url);
    match = imgSrcRegex.exec(content);
  }

  return [...new Set(urls)];
}

/**
 * 기존 MDX URL 목록과 수정 후 MDX URL 목록 비교
 * - removed: 기존에만 있는 URL (삭제 대상)
 * - kept: 새 content에도 있는 URL (유지)
 */
export function diffImages(
  oldUrls: string[],
  newUrls: string[],
): { removed: string[]; kept: string[] } {
  const newSet = new Set(newUrls.map((u) => u));
  const removed = oldUrls.filter((u) => !newSet.has(u));
  const kept = oldUrls.filter((u) => newSet.has(u));
  return { removed, kept };
}

/**
 * TEMP_IMAGE_xxx 플레이스홀더를 실제 업로드 URL로 치환
 * - imageFiles / tempIds 1:1 매칭하여 {resourceId}/content/{uuid}.webp 업로드
 * - 치환된 content와 업로드된 Storage 경로 목록 반환 (롤백용)
 */
export async function uploadContentImages(
  client: SupabaseClient<Database>,
  bucket: string,
  resourceId: string,
  mdxContent: string,
  imageFiles: File[],
  tempIds: string[],
): Promise<{ updatedContent: string; uploadedPaths: string[] }> {
  if (imageFiles.length === 0 || tempIds.length === 0) {
    return { updatedContent: mdxContent, uploadedPaths: [] };
  }

  const imageUrlMap = new Map<string, string>();
  const uploadedPaths: string[] = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const tempId = tempIds[i];
    if (!tempId) continue;

    const imageId = crypto.randomUUID();
    const filePath = `${resourceId}/content/${imageId}.webp`;

    const publicUrl = await uploadToStorage(client, bucket, filePath, file);
    imageUrlMap.set(tempId, publicUrl);
    uploadedPaths.push(filePath);
  }

  if (imageUrlMap.size === 0) {
    return { updatedContent: mdxContent, uploadedPaths: [] };
  }

  let updated = mdxContent;
  imageUrlMap.forEach((publicUrl, tempId) => {
    const tempPattern = `TEMP_IMAGE_${tempId}`;
    const escaped = tempPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    updated = updated.replace(new RegExp(escaped, "g"), publicUrl);
  });

  return { updatedContent: updated, uploadedPaths };
}

/**
 * MDX에서 제거된 이미지 URL에 해당하는 Storage 파일만 삭제
 * - path.startsWith(resourceId + "/") 검증으로 다른 리소스 경로 삭제 금지
 */
export async function deleteRemovedImages(
  client: SupabaseClient<Database>,
  removedUrls: string[],
  bucket: string,
  resourceId: string,
): Promise<void> {
  if (removedUrls.length === 0) return;

  const prefix = `${resourceId}/`;
  const paths: string[] = [];

  for (const url of removedUrls) {
    const path = getStoragePathFromPublicUrl(bucket, url);
    if (!path || !path.startsWith(prefix)) {
      continue;
    }
    paths.push(path);
  }

  if (paths.length === 0) return;

  await removeStorageFiles(client, bucket, paths);
}

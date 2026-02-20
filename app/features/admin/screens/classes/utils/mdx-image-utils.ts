/**
 * MDX 콘텐츠 이미지 URL 추출·비교·업로드·삭제 유틸
 * 클래스 수정 시 content_mdx 내 이미지와 Storage 동기화용.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import {
  getStoragePathFromPublicUrl,
  removeStorageFiles,
  uploadToStorage,
} from "~/features/admin/utils/storage-utils";

/**
 * URL이 해당 클래스의 content 이미지 경로인지 확인
 * (다른 클래스/외부 URL 제외)
 */
function isClassContentImageUrl(url: string, classId: string): boolean {
  return (
    url.includes(`/class/${classId}/content/`) && url.endsWith(".webp")
  );
}

/**
 * MDX 문자열에서 해당 클래스 소유 content 이미지 URL만 추출
 * - 마크다운 ![](url), HTML <img src="url" /> 패턴
 * - class/{classId}/content/*.webp 인 URL만 포함 (다른 클래스/외부 URL 제외)
 */
export function extractMdxImageUrls(content: string, classId: string): string[] {
  if (!content?.trim() || !classId) {
    return [];
  }

  const urls: string[] = [];

  // 마크다운 이미지: ![](url) 또는 ![alt](url)
  const mdImageRegex = /!\[[^\]]*\]\s*\(\s*([^)\s]+)\s*\)/g;
  let match = mdImageRegex.exec(content);
  while (match) {
    const url = match[1].trim();
    if (isClassContentImageUrl(url, classId)) urls.push(url);
    match = mdImageRegex.exec(content);
  }

  // HTML img: src="url"
  const imgSrcRegex = /<img[^>]+src\s*=\s*["']([^"']+)["']/gi;
  match = imgSrcRegex.exec(content);
  while (match) {
    const url = match[1].trim();
    if (isClassContentImageUrl(url, classId)) urls.push(url);
    match = imgSrcRegex.exec(content);
  }

  return [...new Set(urls)];
}

/**
 * 기존 MDX URL 목록과 수정 후 MDX URL 목록을 비교
 * - removed: 기존에만 있고 새 content에는 없는 URL (Storage에서 삭제 대상)
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
 * TEMP_IMAGE_xxx 형식의 플레이스홀더를 실제 업로드 URL로 치환
 * - contentImages / contentImageTempIds와 1:1 매칭하여 class/{classId}/content/{uuid}.webp 로 업로드
 * - 치환된 content_mdx와 업로드된 Storage 경로 목록 반환 (DB 실패 시 롤백용)
 */
export async function uploadContentImages(
  client: SupabaseClient<Database>,
  classId: string,
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
    const filePath = `${classId}/content/${imageId}.webp`;

    const publicUrl = await uploadToStorage(client, "class", filePath, file);
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

const CLASS_BUCKET = "class";

/**
 * MDX에서 제거된 이미지 URL 목록에 해당하는 Storage 파일만 삭제
 * - 해당 classId 경로가 아닌 URL은 무시 (다른 클래스 파일 절대 삭제 금지)
 * - 삭제 실패 시 에러 throw → 호출부에서 DB 업데이트 중단
 */
export async function deleteRemovedImages(
  client: SupabaseClient<Database>,
  removedUrls: string[],
  classId: string,
): Promise<void> {
  if (removedUrls.length === 0) return;

  const prefix = `${classId}/`;
  const paths: string[] = [];

  for (const url of removedUrls) {
    const path = getStoragePathFromPublicUrl(CLASS_BUCKET, url);
    if (!path || !path.startsWith(prefix)) {
      continue;
    }
    paths.push(path);
  }

  if (paths.length === 0) return;

  await removeStorageFiles(client, CLASS_BUCKET, paths);
}

/**
 * 갤러리 MDX·image_urls 이미지 URL 추출·비교·업로드·삭제 유틸
 * 갤러리 수정 시 description/caption 내 content 이미지 및 image_urls와 Storage 동기화용.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import {
  getStoragePathFromPublicUrl,
  removeStorageFiles,
  uploadToStorage,
} from "~/features/admin/utils/storage-utils";

const GALLERY_BUCKET = "gallery";

/** URL이 해당 갤러리의 content 이미지 경로인지 확인 */
function isGalleryContentImageUrl(url: string, galleryId: string): boolean {
  return (
    url.includes(`/gallery/${galleryId}/content/`) && url.endsWith(".webp")
  );
}

/** URL이 해당 갤러리의 images 경로인지 확인 (image_urls용) */
export function isGalleryImagesUrl(url: string, galleryId: string): boolean {
  return (
    url.includes(`/gallery/${galleryId}/images/`) && url.endsWith(".webp")
  );
}

/**
 * MDX 문자열에서 해당 갤러리 소유 content 이미지 URL만 추출
 */
export function extractGalleryMdxImageUrls(
  content: string,
  galleryId: string,
): string[] {
  if (!content?.trim() || !galleryId) return [];

  const urls: string[] = [];
  const mdImageRegex = /!\[[^\]]*\]\s*\(\s*([^)\s]+)\s*\)/g;
  let match = mdImageRegex.exec(content);
  while (match) {
    const url = match[1].trim();
    if (isGalleryContentImageUrl(url, galleryId)) urls.push(url);
    match = mdImageRegex.exec(content);
  }
  const imgSrcRegex = /<img[^>]+src\s*=\s*["']([^"']+)["']/gi;
  match = imgSrcRegex.exec(content);
  while (match) {
    const url = match[1].trim();
    if (isGalleryContentImageUrl(url, galleryId)) urls.push(url);
    match = imgSrcRegex.exec(content);
  }
  return [...new Set(urls)];
}

/** 기존 URL 목록과 수정 후 URL 목록 diff */
export function diffImages(
  oldUrls: string[],
  newUrls: string[],
): { removed: string[]; kept: string[] } {
  const newSet = new Set(newUrls);
  const removed = oldUrls.filter((u) => !newSet.has(u));
  const kept = oldUrls.filter((u) => newSet.has(u));
  return { removed, kept };
}

/**
 * TEMP_IMAGE_xxx 업로드 후 tempId→url 맵과 업로드 경로 반환 (한 번만 업로드, description/caption 공용)
 */
export async function uploadGalleryContentImagesAndGetMap(
  client: SupabaseClient<Database>,
  galleryId: string,
  imageFiles: File[],
  tempIds: string[],
): Promise<{ urlMap: Map<string, string>; uploadedPaths: string[] }> {
  const imageUrlMap = new Map<string, string>();
  const uploadedPaths: string[] = [];
  if (imageFiles.length === 0 || tempIds.length === 0) {
    return { urlMap: imageUrlMap, uploadedPaths };
  }
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const tempId = tempIds[i];
    if (!tempId) continue;
    const imageId = crypto.randomUUID();
    const filePath = `${galleryId}/content/${imageId}.webp`;
    const publicUrl = await uploadToStorage(
      client,
      GALLERY_BUCKET,
      filePath,
      file,
    );
    imageUrlMap.set(tempId, publicUrl);
    uploadedPaths.push(filePath);
  }
  return { urlMap: imageUrlMap, uploadedPaths };
}

/**
 * 문자열 내 TEMP_IMAGE_xxx를 urlMap으로 치환
 * 갤러리 전용: 마크다운 이미지 문법 ![alt](TEMP_IMAGE_xxx) → 순수 URL만 추출
 */
export function replaceTempInContent(
  content: string,
  urlMap: Map<string, string>,
): string {
  if (urlMap.size === 0 || !content) return content;
  let updated = content;
  urlMap.forEach((publicUrl, tempId) => {
    const tempPattern = `TEMP_IMAGE_${tempId}`;
    const escaped = tempPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    // 마크다운 이미지 패턴: ![alt](TEMP_IMAGE_xxx) → 순수 URL만
    // imageUrl= 또는 responsiveImageUrl= 같은 prop에 사용될 때 마크다운 문법 제거
    const mdPattern = new RegExp(`!\\[[^\\]]*\\]\\(${escaped}\\)`, "g");
    updated = updated.replace(mdPattern, publicUrl);
    
    // 남은 일반 TEMP_IMAGE_xxx → URL (마크다운 아닌 경우 대비)
    updated = updated.replace(new RegExp(escaped, "g"), publicUrl);
  });
  return updated;
}

/**
 * TEMP_IMAGE_xxx 치환 및 content 업로드, 업로드된 경로 목록 반환 (단일 필드용)
 */
export async function uploadGalleryContentImages(
  client: SupabaseClient<Database>,
  galleryId: string,
  mdxContent: string,
  imageFiles: File[],
  tempIds: string[],
): Promise<{ updatedContent: string; uploadedPaths: string[] }> {
  const { urlMap, uploadedPaths } = await uploadGalleryContentImagesAndGetMap(
    client,
    galleryId,
    imageFiles,
    tempIds,
  );
  const updatedContent = replaceTempInContent(mdxContent, urlMap);
  return { updatedContent, uploadedPaths };
}

/**
 * MDX에서 제거된 이미지에 해당하는 Storage 파일만 삭제 (galleryId 경로 검증)
 */
export async function deleteRemovedGalleryContentImages(
  client: SupabaseClient<Database>,
  removedUrls: string[],
  galleryId: string,
): Promise<void> {
  if (removedUrls.length === 0) return;
  const prefix = `${galleryId}/`;
  const paths: string[] = [];
  for (const url of removedUrls) {
    const path = getStoragePathFromPublicUrl(GALLERY_BUCKET, url);
    if (!path || !path.startsWith(prefix)) continue;
    paths.push(path);
  }
  if (paths.length === 0) return;
  await removeStorageFiles(client, GALLERY_BUCKET, paths);
}

/**
 * image_urls에서 제거된 URL에 해당하는 Storage 파일만 삭제 (galleryId/images/ 경로만)
 */
export async function deleteRemovedGalleryImages(
  client: SupabaseClient<Database>,
  removedUrls: string[],
  galleryId: string,
): Promise<void> {
  if (removedUrls.length === 0) return;
  const prefix = `${galleryId}/`;
  const paths: string[] = [];
  for (const url of removedUrls) {
    const path = getStoragePathFromPublicUrl(GALLERY_BUCKET, url);
    if (!path || !path.startsWith(prefix)) continue;
    paths.push(path);
  }
  if (paths.length === 0) return;
  await removeStorageFiles(client, GALLERY_BUCKET, paths);
}

/**
 * 새 갤러리 이미지 파일들을 gallery/{galleryId}/images/{uuid}.webp 로 업로드 후 public URL 배열 반환
 */
export async function uploadGalleryImages(
  client: SupabaseClient<Database>,
  galleryId: string,
  files: File[],
): Promise<{ urls: string[]; uploadedPaths: string[] }> {
  const urls: string[] = [];
  const uploadedPaths: string[] = [];
  for (const file of files) {
    const imageId = crypto.randomUUID();
    const filePath = `${galleryId}/images/${imageId}.webp`;
    const publicUrl = await uploadToStorage(
      client,
      GALLERY_BUCKET,
      filePath,
      file,
    );
    urls.push(publicUrl);
    uploadedPaths.push(filePath);
  }
  return { urls, uploadedPaths };
}

/**
 * 갤러리 수정 서비스
 * 썸네일·MDX(description/caption)·image_urls·태그·DB 업데이트를 원자적으로 처리합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import {
  deleteRemovedGalleryContentImages,
  deleteRemovedGalleryImages,
  diffImages,
  extractGalleryMdxImageUrls,
  replaceTempInContent,
  uploadGalleryContentImagesAndGetMap,
  uploadGalleryImages,
} from "~/features/admin/screens/galleries/utils/gallery-image-utils";
import {
  getStoragePathFromPublicUrl,
  removeStorageFiles,
  uploadToStorage,
} from "~/features/admin/utils/storage-utils";
import {
  processTagsForGallery,
  unlinkAllTagsFromGallery,
} from "~/features/admin/utils/tag-utils";

const GALLERY_BUCKET = "gallery";

/** 수정 폼에서 넘어온 데이터 */
export interface UpdateGalleryInput {
  title: string;
  subtitle: string | null;
  description: string | null;
  caption: string | null;
  category: string;
  isPublished: boolean;
  tagString: string;
  thumbnailFile: File | null;
  contentImageFiles: File[];
  contentImageTempIds: string[];
  /** 유지할 image_urls (기존 URL + 새로 업로드될 URL은 서버에서 합침) */
  keptImageUrls: string[];
  /** 새로 추가할 갤러리 이미지 파일들 */
  galleryImageFiles: File[];
}

/** 기존 갤러리 행 */
export interface ExistingGalleryRow {
  id: string;
  description: string | null;
  caption: string | null;
  thumbnail_image_url: string | null;
  image_urls: string[];
}

/**
 * 갤러리 수정 전체 흐름
 * - 썸네일: (1) 새 파일 업로드(UUID 파일명) (2) DB 반영 (3) 기존 썸네일 Storage만 삭제. DB 실패 시 방금 업로드한 파일 롤백.
 * - MDX: description/caption에서 기존 URL 추출, TEMP 업로드·치환, 제거된 이미지 Storage 삭제
 * - image_urls: 기존와 새 배열 diff, 제거된 파일만 삭제, 새 파일 업로드 후 재구성
 * - 태그: 기존 gallery_tags 전부 삭제 후 재연결
 * - DB: title, subtitle, description, caption, category, is_published, thumbnail_image_url, image_urls, updated_at
 */
export async function updateGalleryService(
  client: SupabaseClient<Database>,
  existing: ExistingGalleryRow,
  input: UpdateGalleryInput,
): Promise<void> {
  const galleryId = existing.id;
  const prefix = `${galleryId}/`;

  let finalDescription = input.description ?? "";
  let finalCaption = input.caption ?? null;
  let finalThumbnailUrl: string | null = existing.thumbnail_image_url;
  let finalImageUrls: string[] = [...(existing.image_urls || [])];
  const uploadedContentPaths: string[] = [];
  const uploadedImagePaths: string[] = [];
  /** 이번 요청에서 업로드한 썸네일 경로 (DB 실패 시 롤백용) */
  let uploadedThumbPath: string | null = null;

  try {
    // ---- A. 썸네일: (1) 새 파일만 업로드, 기존 삭제는 DB 반영 후 수행 ----
    if (input.thumbnailFile && input.thumbnailFile.size > 0) {
      const fileName = `thumbnail_${crypto.randomUUID()}.webp`;
      const newThumbPath = `${galleryId}/${fileName}`;
      await uploadToStorage(
        client,
        GALLERY_BUCKET,
        newThumbPath,
        input.thumbnailFile,
      );
      const {
        data: { publicUrl: newThumbUrl },
      } = client.storage.from(GALLERY_BUCKET).getPublicUrl(newThumbPath);

      uploadedThumbPath = newThumbPath;
      finalThumbnailUrl = newThumbUrl;
    }

    // ---- B. MDX(description/caption) 이미지 처리 (한 번 업로드 후 두 필드에 치환) ----
    const oldDescUrls = extractGalleryMdxImageUrls(
      existing.description ?? "",
      galleryId,
    );
    const oldCaptionUrls = extractGalleryMdxImageUrls(
      existing.caption ?? "",
      galleryId,
    );
    const oldMdxUrls = [...new Set([...oldDescUrls, ...oldCaptionUrls])];

    const { urlMap: contentUrlMap, uploadedPaths: contentPaths } =
      await uploadGalleryContentImagesAndGetMap(
        client,
        galleryId,
        input.contentImageFiles,
        input.contentImageTempIds,
      );
    uploadedContentPaths.push(...contentPaths);
    finalDescription = replaceTempInContent(finalDescription, contentUrlMap);
    finalCaption = replaceTempInContent(finalCaption ?? "", contentUrlMap) || null;

    const newDescUrls = extractGalleryMdxImageUrls(finalDescription, galleryId);
    const newCaptionUrls = extractGalleryMdxImageUrls(
      finalCaption ?? "",
      galleryId,
    );
    const newMdxUrls = [...new Set([...newDescUrls, ...newCaptionUrls])];
    const { removed: removedMdxUrls } = diffImages(oldMdxUrls, newMdxUrls);
    await deleteRemovedGalleryContentImages(
      client,
      removedMdxUrls,
      galleryId,
    );

    // ---- C. image_urls 처리 ----
    const { urls: newUploadedUrls, uploadedPaths: newImagePaths } =
      await uploadGalleryImages(client, galleryId, input.galleryImageFiles);
    uploadedImagePaths.push(...newImagePaths);
    const newImageUrlsArray = [...input.keptImageUrls, ...newUploadedUrls];
    const { removed: removedImageUrls } = diffImages(
      existing.image_urls || [],
      newImageUrlsArray,
    );
    await deleteRemovedGalleryImages(client, removedImageUrls, galleryId);
    finalImageUrls = newImageUrlsArray;

    // ---- D. 태그 처리 ----
    await unlinkAllTagsFromGallery(client, galleryId);
    if (input.tagString.trim()) {
      await processTagsForGallery(client, galleryId, input.tagString);
    }

    // ---- E. DB 업데이트 ----
    const { error: updateError } = await client
      .from("galleries")
      .update({
        title: input.title.trim(),
        subtitle: input.subtitle?.trim() || null,
        description: finalDescription || null,
        caption: finalCaption,
        category: input.category,
        is_published: input.isPublished,
        thumbnail_image_url: finalThumbnailUrl,
        image_urls: finalImageUrls,
        updated_at: new Date().toISOString(),
      })
      .eq("id", galleryId);

    if (updateError) {
      throw new Error(`갤러리 업데이트 실패: ${updateError.message}`);
    }

    // ---- F. DB 반영 후 기존 썸네일 파일만 Storage에서 삭제 (폴더/콘텐츠 이미지 건드리지 않음) ----
    if (uploadedThumbPath && existing.thumbnail_image_url) {
      const oldPath = getStoragePathFromPublicUrl(
        GALLERY_BUCKET,
        existing.thumbnail_image_url,
      );
      if (oldPath && oldPath.startsWith(prefix)) {
        try {
          await removeStorageFiles(client, GALLERY_BUCKET, [oldPath]);
        } catch {
          // 기존 파일 삭제 실패는 무시 (새 URL은 이미 DB에 반영됨)
        }
      }
    }
  } catch (err) {
    if (uploadedThumbPath) {
      try {
        await removeStorageFiles(client, GALLERY_BUCKET, [uploadedThumbPath]);
      } catch {
        // 롤백 삭제 실패는 무시
      }
    }
    const allUploaded = [...uploadedContentPaths, ...uploadedImagePaths];
    if (allUploaded.length > 0) {
      const toRemove = allUploaded.filter((p) => p.startsWith(prefix));
      if (toRemove.length > 0) {
        try {
          await removeStorageFiles(client, GALLERY_BUCKET, toRemove);
        } catch {
          // 롤백 삭제 실패는 무시, 원래 에러를 다시 throw
        }
      }
    }
    throw err;
  }
}

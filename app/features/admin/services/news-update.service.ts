/**
 * 뉴스 수정 서비스
 * 썸네일·커버·MDX 이미지·DB 업데이트. 삭제 실패 시 롤백, DB 실패 시 이번 요청 업로드 파일 롤백.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import {
  deleteRemovedImages,
  diffImages,
  extractMdxImageUrls,
  uploadContentImages,
} from "../utils/mdx-image-utils";
import {
  getStoragePathFromPublicUrl,
  removeStorageFiles,
  uploadToStorage,
} from "../utils/storage-utils";

const NEWS_BUCKET = "news";

export interface UpdateNewsInput {
  title: string;
  category: string;
  content: string;
  visibility: "public" | "member";
  isPublished: boolean;
  thumbnailFile: File | null;
  coverFile: File | null;
  contentImageFiles: File[];
  contentImageTempIds: string[];
}

export interface ExistingNewsRow {
  id: string;
  content_mdx: string;
  thumbnail_image_url: string | null;
  cover_image_urls: string[];
}

/**
 * 뉴스 수정 전체 흐름
 * - 썸네일: 새 파일 있으면 업로드 → 기존 삭제 (실패 시 새 파일 롤백) → DB 반영
 * - 커버: 동일
 * - MDX: 기존 URL 추출, TEMP 업로드·치환, 제거된 이미지만 삭제 (삭제 실패 시 DB 업데이트 중단), DB 실패 시 신규 업로드 롤백
 * - slug 수정 금지
 */
export async function updateNewsService(
  client: SupabaseClient<Database>,
  existing: ExistingNewsRow,
  input: UpdateNewsInput,
): Promise<void> {
  const newsId = existing.id;
  const prefix = `${newsId}/`;

  let finalContent = input.content;
  let finalThumbnailUrl: string | null = existing.thumbnail_image_url;
  let finalCoverUrls: string[] = existing.cover_image_urls ?? [];
  const uploadedPaths: string[] = [];

  try {
    // ---- A. 썸네일 ----
    if (input.thumbnailFile && input.thumbnailFile.size > 0) {
      const newThumbPath = `${newsId}/thumbnail.webp`;
      await uploadToStorage(
        client,
        NEWS_BUCKET,
        newThumbPath,
        input.thumbnailFile,
      );
      const {
        data: { publicUrl: newThumbUrl },
      } = client.storage.from(NEWS_BUCKET).getPublicUrl(newThumbPath);

      if (existing.thumbnail_image_url) {
        const oldPath = getStoragePathFromPublicUrl(
          NEWS_BUCKET,
          existing.thumbnail_image_url,
        );
        if (oldPath && oldPath.startsWith(prefix)) {
          try {
            await removeStorageFiles(client, NEWS_BUCKET, [oldPath]);
          } catch {
            await removeStorageFiles(client, NEWS_BUCKET, [newThumbPath]);
            throw new Error("기존 썸네일 삭제 실패로 수정을 중단했습니다.");
          }
        }
      }
      finalThumbnailUrl = newThumbUrl;
    }

    // ---- B. 커버 ----
    if (input.coverFile && input.coverFile.size > 0) {
      const newCoverPath = `${newsId}/cover.webp`;
      await uploadToStorage(
        client,
        NEWS_BUCKET,
        newCoverPath,
        input.coverFile,
      );
      const {
        data: { publicUrl: newCoverUrl },
      } = client.storage.from(NEWS_BUCKET).getPublicUrl(newCoverPath);

      const oldCoverUrl = existing.cover_image_urls?.[0];
      if (oldCoverUrl) {
        const oldPath = getStoragePathFromPublicUrl(NEWS_BUCKET, oldCoverUrl);
        if (oldPath && oldPath.startsWith(prefix)) {
          try {
            await removeStorageFiles(client, NEWS_BUCKET, [oldPath]);
          } catch {
            await removeStorageFiles(client, NEWS_BUCKET, [newCoverPath]);
            throw new Error("기존 커버 삭제 실패로 수정을 중단했습니다.");
          }
        }
      }
      finalCoverUrls = [newCoverUrl];
    }

    // ---- C. MDX 이미지 ----
    const oldUrls = extractMdxImageUrls(
      existing.content_mdx,
      NEWS_BUCKET,
      newsId,
    );

    const { updatedContent, uploadedPaths: contentPaths } =
      await uploadContentImages(
        client,
        NEWS_BUCKET,
        newsId,
        input.content,
        input.contentImageFiles,
        input.contentImageTempIds,
      );
    finalContent = updatedContent;
    uploadedPaths.push(...contentPaths);

    const newUrls = extractMdxImageUrls(finalContent, NEWS_BUCKET, newsId);
    const { removed } = diffImages(oldUrls, newUrls);

    await deleteRemovedImages(
      client,
      removed,
      NEWS_BUCKET,
      newsId,
    );

    // ---- D. DB 업데이트 ----
    const { error: updateError } = await client
      .from("news")
      .update({
        title: input.title.trim(),
        category: input.category,
        content_mdx: finalContent,
        visibility: input.visibility,
        is_published: input.isPublished,
        thumbnail_image_url: finalThumbnailUrl,
        cover_image_urls: finalCoverUrls,
        updated_at: new Date().toISOString(),
      })
      .eq("id", newsId);

    if (updateError) {
      throw new Error(`뉴스 업데이트 실패: ${updateError.message}`);
    }
  } catch (err) {
    if (uploadedPaths.length > 0) {
      try {
        await removeStorageFiles(client, NEWS_BUCKET, uploadedPaths);
      } catch {
        // 롤백 삭제 실패 시에도 원래 에러 유지
      }
    }
    throw err;
  }
}

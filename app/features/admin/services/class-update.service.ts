/**
 * 클래스 수정 서비스
 * 썸네일·MDX 이미지·태그·DB 업데이트를 원자적으로 처리합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import {
  deleteRemovedImages,
  diffImages,
  extractMdxImageUrls,
  uploadContentImages,
} from "~/features/admin/screens/classes/utils/mdx-image-utils";
import {
  getStoragePathFromPublicUrl,
  removeStorageFiles,
  uploadToStorage,
} from "~/features/admin/utils/storage-utils";
import {
  processTagsForClass,
  unlinkAllTagsFromClass,
} from "~/features/admin/utils/tag-utils";

const CLASS_BUCKET = "class";

/** 수정 폼에서 넘어온 데이터 */
export interface UpdateClassInput {
  title: string;
  description: string | null;
  category: string;
  content: string;
  isPublished: boolean;
  tagString: string;
  thumbnailFile: File | null;
  contentImageFiles: File[];
  contentImageTempIds: string[];
}

/** 기존 클래스 행 (로더/조회 결과) */
export interface ExistingClassRow {
  id: string;
  content_mdx: string;
  thumbnail_image_url: string | null;
}

/**
 * 클래스 수정 전체 흐름
 * - 썸네일: (1) 새 파일 업로드(UUID 파일명) (2) DB 반영 (3) 기존 썸네일 Storage만 삭제. DB 실패 시 방금 업로드한 파일 롤백.
 * - MDX 이미지: 기존 URL 추출, TEMP 업로드·치환, 제거된 이미지 Storage 삭제 (실패 시 중단), DB 실패 시 신규 업로드 롤백
 * - 태그: 기존 class_tags 전부 삭제 후 재연결
 * - DB: title, description, content_mdx, is_published, updated_at, (썸네일 변경 시 thumbnail_image_url)
 */
export async function updateClassService(
  client: SupabaseClient<Database>,
  existing: ExistingClassRow,
  input: UpdateClassInput,
): Promise<void> {
  const classId = existing.id;
  const prefix = `${classId}/`;

  let finalContent = input.content;
  let finalThumbnailUrl: string | null = existing.thumbnail_image_url;
  const uploadedContentPaths: string[] = [];
  /** 이번 요청에서 업로드한 썸네일 경로 (DB 실패 시 롤백용) */
  let uploadedThumbPath: string | null = null;

  try {
    // ---- A. 썸네일: (1) 새 파일만 업로드, 기존 삭제는 DB 반영 후 수행 ----
    if (input.thumbnailFile && input.thumbnailFile.size > 0) {
      const fileName = `thumbnail_${crypto.randomUUID()}.webp`;
      const newThumbPath = `${classId}/${fileName}`;
      await uploadToStorage(
        client,
        CLASS_BUCKET,
        newThumbPath,
        input.thumbnailFile,
      );
      const {
        data: { publicUrl: newThumbUrl },
      } = client.storage.from(CLASS_BUCKET).getPublicUrl(newThumbPath);

      uploadedThumbPath = newThumbPath;
      finalThumbnailUrl = newThumbUrl;
    }

    // ---- B. MDX 이미지 처리 ----
    const oldUrls = extractMdxImageUrls(existing.content_mdx, classId);

    const { updatedContent, uploadedPaths } = await uploadContentImages(
      client,
      classId,
      input.content,
      input.contentImageFiles,
      input.contentImageTempIds,
    );
    finalContent = updatedContent;
    uploadedContentPaths.push(...uploadedPaths);

    const newUrls = extractMdxImageUrls(finalContent, classId);
    const { removed } = diffImages(oldUrls, newUrls);

    await deleteRemovedImages(client, removed, classId);

    // ---- C. 태그 처리 ----
    await unlinkAllTagsFromClass(client, classId);
    if (input.tagString.trim()) {
      await processTagsForClass(client, classId, input.tagString);
    }

    // ---- D. DB 업데이트 ----
    const { error: updateError } = await client
      .from("classes")
      .update({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        category: input.category,
        content_mdx: finalContent,
        is_published: input.isPublished,
        thumbnail_image_url: finalThumbnailUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", classId);

    if (updateError) {
      throw new Error(`클래스 업데이트 실패: ${updateError.message}`);
    }

    // ---- E. DB 반영 후 기존 썸네일 파일만 Storage에서 삭제 (폴더/콘텐츠 이미지 건드리지 않음) ----
    if (uploadedThumbPath && existing.thumbnail_image_url) {
      const oldPath = getStoragePathFromPublicUrl(
        CLASS_BUCKET,
        existing.thumbnail_image_url,
      );
      if (oldPath && oldPath.startsWith(prefix)) {
        try {
          await removeStorageFiles(client, CLASS_BUCKET, [oldPath]);
        } catch {
          // 기존 파일 삭제 실패는 무시 (새 URL은 이미 DB에 반영됨)
        }
      }
    }
  } catch (err) {
    if (uploadedThumbPath) {
      try {
        await removeStorageFiles(client, CLASS_BUCKET, [uploadedThumbPath]);
      } catch {
        // 롤백 삭제 실패는 무시, 원래 에러를 다시 throw
      }
    }
    if (uploadedContentPaths.length > 0) {
      try {
        await removeStorageFiles(client, CLASS_BUCKET, uploadedContentPaths);
      } catch {
        // 롤백 삭제 실패는 로깅만, 원래 에러를 다시 throw
      }
    }
    throw err;
  }
}

/**
 * 갤러리 생성 서비스
 * 갤러리 생성과 관련된 비즈니스 로직을 처리합니다.
 * 원자성: Storage 실패 시 DB 롤백, DB 실패 시 이번 요청 업로드 파일 삭제.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import { logger } from "~/core/utils/logger";

import {
  deleteGalleryStorageFolder,
  uploadToStorage,
} from "../utils/storage-utils";
import { processTagsForGallery } from "../utils/tag-utils";

/** 갤러리 Storage 버킷 이름 */
const GALLERY_BUCKET = "gallery";

/** 갤러리 생성 입력 데이터 (클래스 description=subtitle, content_mdx=description, caption=추가 MDX) */
export interface CreateGalleryData {
  title: string;
  subtitle: string | null;
  description: string | null;
  caption: string | null;
  category: string;
  isPublished: boolean;
  authorId: string;
  slug: string;
}

/**
 * 갤러리용 고유 slug 생성
 */
export async function generateUniqueSlugForGallery(
  client: SupabaseClient<Database>,
  title: string,
): Promise<string> {
  const { data: slugData, error: slugError } = await client.rpc(
    "generate_slug",
    { input_text: title },
  );

  if (slugError || !slugData) {
    throw new Error(`Slug 생성 실패: ${slugError?.message ?? "알 수 없는 오류"}`);
  }

  let slug = slugData as string;

  const { data: existing } = await client
    .from("galleries")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    const uniqueSlug = `${slug}-${Date.now()}`;
    const { data: uniqueSlugData } = await client.rpc("generate_slug", {
      input_text: uniqueSlug,
    });
    if (uniqueSlugData) {
      slug = uniqueSlugData as string;
    }
  }

  return slug;
}

/**
 * 기본 갤러리 레코드 생성 (썸네일 제외)
 */
export async function createGalleryBase(
  client: SupabaseClient<Database>,
  data: CreateGalleryData,
): Promise<string> {
  const { data: row, error } = await client
    .from("galleries")
    .insert({
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      caption: data.caption,
      category: data.category,
      slug: data.slug,
      author_id: data.authorId,
      is_published: data.isPublished,
      thumbnail_image_url: null,
      image_urls: [],
    })
    .select("id")
    .single();

  if (error || !row) {
    throw new Error(`갤러리 생성 실패: ${error?.message ?? "알 수 없는 오류"}`);
  }

  return row.id as string;
}

/**
 * 갤러리 썸네일 업로드 후 DB 반영
 * 파일명: thumbnail_{uuid}.webp (캐시 무효화)
 */
export async function uploadGalleryThumbnail(
  client: SupabaseClient<Database>,
  galleryId: string,
  file: File,
): Promise<string> {
  const fileName = `thumbnail_${crypto.randomUUID()}.webp`;
  const filePath = `${galleryId}/${fileName}`;
  const publicUrl = await uploadToStorage(
    client,
    GALLERY_BUCKET,
    filePath,
    file,
  );

  const { error: updateError } = await client
    .from("galleries")
    .update({ thumbnail_image_url: publicUrl })
    .eq("id", galleryId);

  if (updateError) {
    throw new Error(`썸네일 URL 업데이트 실패: ${updateError.message}`);
  }

  return publicUrl;
}

/**
 * TEMP_IMAGE_xxx 업로드 후 tempId → publicUrl 맵 반환 (한 번만 업로드, description/caption 공용)
 */
export async function uploadGalleryContentImagesAndGetUrlMap(
  client: SupabaseClient<Database>,
  galleryId: string,
  imageFiles: File[],
  tempIds: string[],
): Promise<Map<string, string>> {
  const imageUrlMap = new Map<string, string>();
  if (imageFiles.length === 0 || tempIds.length === 0) return imageUrlMap;

  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i];
    const tempId = tempIds[i];
    if (!tempId) {
      logger.warn(`임시 ID가 없는 이미지 파일 건너뜀 (인덱스: ${i})`);
      continue;
    }
    const imageId = crypto.randomUUID();
    const filePath = `${galleryId}/content/${imageId}.webp`;
    const publicUrl = await uploadToStorage(
      client,
      GALLERY_BUCKET,
      filePath,
      imageFile,
    );
    imageUrlMap.set(tempId, publicUrl);
  }
  return imageUrlMap;
}

/**
 * 문자열 내 TEMP_IMAGE_xxx를 urlMap으로 치환
 * 갤러리 전용: 마크다운 이미지 문법 ![alt](TEMP_IMAGE_xxx) → 순수 URL만 추출
 */
function replaceTempImagesInString(
  content: string,
  urlMap: Map<string, string>,
): string {
  if (urlMap.size === 0) return content;
  let result = content;
  urlMap.forEach((publicUrl, tempId) => {
    const tempPattern = `TEMP_IMAGE_${tempId}`;
    const escaped = tempPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    // 마크다운 이미지 패턴: ![alt](TEMP_IMAGE_xxx) → 순수 URL만
    // imageUrl= 또는 responsiveImageUrl= 같은 prop에 사용될 때 마크다운 문법 제거
    const mdPattern = new RegExp(`!\\[[^\\]]*\\]\\(${escaped}\\)`, "g");
    result = result.replace(mdPattern, publicUrl);
    
    // 남은 일반 TEMP_IMAGE_xxx → URL (마크다운 아닌 경우 대비)
    result = result.replace(new RegExp(escaped, "g"), publicUrl);
  });
  return result;
}

/**
 * 갤러리 description / caption 업데이트 (MDX 본문·추가 캡션)
 */
export async function updateGalleryDescriptionAndCaption(
  client: SupabaseClient<Database>,
  galleryId: string,
  description: string,
  caption: string | null,
): Promise<void> {
  const { error } = await client
    .from("galleries")
    .update({ description, caption: caption ?? null })
    .eq("id", galleryId);

  if (error) {
    throw new Error(`갤러리 본문 업데이트 실패: ${error.message}`);
  }
}

/**
 * 갤러리 생성 전체 흐름 (원자성 보장)
 * 1. DB insert (썸네일 제외, subtitle/description/caption)
 * 2. 썸네일 업로드
 * 3. MDX TEMP 이미지 업로드 + description/caption URL 치환
 * 4. 태그 처리
 * 5. DB update (thumbnail_url, description, caption)
 * 실패 시: Storage 실패 → 갤러리 행 삭제 + 업로드 파일 삭제
 */
export async function createGallery(
  client: SupabaseClient<Database>,
  params: {
    title: string;
    subtitle: string | null;
    description: string | null;
    caption: string | null;
    category: string;
    isPublished: boolean;
    authorId: string;
    thumbnailFile: File | null;
    contentImageFiles: File[];
    contentImageTempIds: string[];
    tagString: string;
  },
): Promise<string> {
  const slug = await generateUniqueSlugForGallery(client, params.title);

  const galleryId = await createGalleryBase(client, {
    title: params.title,
    subtitle: params.subtitle,
    description: params.description,
    caption: params.caption,
    category: params.category,
    isPublished: params.isPublished,
    authorId: params.authorId,
    slug,
  });

  const rollbackDbAndStorage = async () => {
    try {
      await client.from("galleries").delete().eq("id", galleryId);
    } catch (e) {
      logger.error("갤러리 롤백 삭제 실패:", e);
    }
    try {
      await deleteGalleryStorageFolder(client, galleryId);
    } catch (e) {
      logger.error("갤러리 Storage 롤백 삭제 실패:", e);
    }
  };

  try {
    if (params.thumbnailFile && params.thumbnailFile.size > 0) {
      await uploadGalleryThumbnail(
        client,
        galleryId,
        params.thumbnailFile,
      );
    }

    if (params.contentImageFiles.length > 0 && params.contentImageTempIds.length > 0) {
      const urlMap = await uploadGalleryContentImagesAndGetUrlMap(
        client,
        galleryId,
        params.contentImageFiles,
        params.contentImageTempIds,
      );
      if (urlMap.size > 0) {
        const finalDescription = replaceTempImagesInString(
          params.description ?? "",
          urlMap,
        );
        const finalCaption = replaceTempImagesInString(
          params.caption ?? "",
          urlMap,
        );
        await updateGalleryDescriptionAndCaption(
          client,
          galleryId,
          finalDescription,
          finalCaption || null,
        );
      }
    }

    if (params.tagString.trim()) {
      await processTagsForGallery(client, galleryId, params.tagString);
    }

    return galleryId;
  } catch (err) {
    await rollbackDbAndStorage();
    throw err;
  }
}

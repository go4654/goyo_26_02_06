/**
 * 클래스 생성 서비스
 * 클래스 생성과 관련된 비즈니스 로직을 처리합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import { logger } from "~/core/utils/logger";

import { uploadToStorage } from "../utils/storage-utils";
import { processTagsForClass } from "../utils/tag-utils";

/**
 * 클래스 생성 데이터
 */
export interface CreateClassData {
  title: string;
  description: string | null;
  category: string;
  content: string;
  isPublished: boolean;
  authorId: string;
  slug: string;
}

/**
 * 기본 클래스 레코드를 생성합니다.
 */
export async function createClassBase(
  client: SupabaseClient<Database>,
  data: CreateClassData,
): Promise<string> {
  const { data: newClass, error } = await client
    .from("classes")
    .insert({
      title: data.title,
      description: data.description,
      category: data.category,
      slug: data.slug,
      content_mdx: data.content,
      author_id: data.authorId,
      is_published: data.isPublished,
      thumbnail_image_url: null,
    })
    .select("id")
    .single();

  if (error || !newClass) {
    throw new Error(`클래스 생성 실패: ${error?.message || "알 수 없는 오류"}`);
  }

  return newClass.id as string;
}

/**
 * 썸네일 이미지를 업로드하고 URL을 DB에 업데이트합니다.
 * 파일명: thumbnail_{uuid}.webp (캐시 무효화)
 */
export async function uploadThumbnail(
  client: SupabaseClient<Database>,
  classId: string,
  file: File,
): Promise<string> {
  const fileName = `thumbnail_${crypto.randomUUID()}.webp`;
  const filePath = `${classId}/${fileName}`;
  const publicUrl = await uploadToStorage(client, "class", filePath, file);

  const { error: updateError } = await client
    .from("classes")
    .update({ thumbnail_image_url: publicUrl })
    .eq("id", classId);

  if (updateError) {
    throw new Error(`썸네일 URL 업데이트 실패: ${updateError.message}`);
  }

  return publicUrl;
}

/**
 * MDX 콘텐츠 임시 이미지를 업로드하고 URL을 교체합니다.
 */
export async function processTempImages(
  client: SupabaseClient<Database>,
  classId: string,
  mdxContent: string,
  imageFiles: File[],
  tempIds: string[],
): Promise<string> {
  if (imageFiles.length === 0 || tempIds.length === 0) {
    return mdxContent;
  }

  const imageUrlMap = new Map<string, string>();

  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i];
    const tempId = tempIds[i];

    if (!tempId) {
      logger.warn(`임시 ID가 없는 이미지 파일 건너뜀 (인덱스: ${i})`);
      continue;
    }

    const imageId = crypto.randomUUID();
    const filePath = `${classId}/content/${imageId}.webp`;

    try {
      const publicUrl = await uploadToStorage(
        client,
        "class",
        filePath,
        imageFile,
      );
      imageUrlMap.set(tempId, publicUrl);
    } catch (error) {
      logger.error(`콘텐츠 이미지 업로드 실패 (${tempId}):`, error);
    }
  }

  if (imageUrlMap.size === 0) {
    return mdxContent;
  }

  let updatedContent = mdxContent;
  imageUrlMap.forEach((publicUrl, tempId) => {
    const tempPattern = `TEMP_IMAGE_${tempId}`;
    updatedContent = updatedContent.replace(
      new RegExp(tempPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      publicUrl,
    );
  });

  return updatedContent;
}

/**
 * 클래스 콘텐츠를 업데이트합니다.
 */
export async function updateClassContent(
  client: SupabaseClient<Database>,
  classId: string,
  content: string,
): Promise<void> {
  const { error } = await client
    .from("classes")
    .update({ content_mdx: content })
    .eq("id", classId);

  if (error) {
    throw new Error(`콘텐츠 업데이트 실패: ${error.message}`);
  }
}

/**
 * 고유한 slug를 생성합니다.
 */
export async function generateUniqueSlug(
  client: SupabaseClient<Database>,
  title: string,
): Promise<string> {
  const { data: slugData, error: slugError } = await client.rpc(
    "generate_slug",
    { input_text: title },
  );

  if (slugError || !slugData) {
    throw new Error(`Slug 생성 실패: ${slugError?.message || "알 수 없는 오류"}`);
  }

  let slug = slugData as string;

  const { data: existingClass } = await client
    .from("classes")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existingClass) {
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
 * 태그를 처리합니다.
 */
export async function processTags(
  client: SupabaseClient<Database>,
  classId: string,
  tagString: string,
): Promise<void> {
  if (!tagString.trim()) {
    return;
  }

  try {
    await processTagsForClass(client, classId, tagString);
  } catch (error) {
    logger.error("태그 처리 실패:", error);
  }
}

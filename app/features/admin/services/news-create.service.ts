/**
 * 뉴스 생성 서비스
 * 뉴스 등록 시 DB insert → 썸네일/커버/MDX 이미지 업로드 → DB update.
 * Storage 실패 시 DB 업데이트 중단, DB 실패 시 이번 요청에서 업로드한 파일만 삭제.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import { uploadContentImages } from "../utils/mdx-image-utils";
import {
  removeStorageFiles,
  uploadToStorage,
} from "../utils/storage-utils";

const NEWS_BUCKET = "news";

export interface CreateNewsData {
  title: string;
  category: string;
  contentMdx: string;
  isPublished: boolean;
  visibility: "public" | "member";
  authorId: string | null;
  slug: string;
}

/**
 * 뉴스용 고유 slug 생성
 */
export async function generateUniqueSlugForNews(
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
    .from("news")
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
 * 기본 뉴스 레코드 생성 (썸네일·커버 제외)
 */
export async function createNewsBase(
  client: SupabaseClient<Database>,
  data: CreateNewsData,
): Promise<string> {
  const { data: row, error } = await client
    .from("news")
    .insert({
      title: data.title,
      category: data.category,
      slug: data.slug,
      content_mdx: data.contentMdx,
      author_id: data.authorId,
      is_published: data.isPublished,
      visibility: data.visibility,
      thumbnail_image_url: null,
      cover_image_urls: [],
    })
    .select("id")
    .single();

  if (error || !row) {
    throw new Error(`뉴스 생성 실패: ${error?.message ?? "알 수 없는 오류"}`);
  }

  return row.id as string;
}

/**
 * 뉴스 썸네일 업로드 (news/{newsId}/thumbnail.webp)
 * 업로드된 경로 반환 (롤백용)
 */
export async function uploadNewsThumbnail(
  client: SupabaseClient<Database>,
  newsId: string,
  file: File,
): Promise<{ publicUrl: string; path: string }> {
  const path = `${newsId}/thumbnail.webp`;
  const publicUrl = await uploadToStorage(client, NEWS_BUCKET, path, file);
  return { publicUrl, path };
}

/**
 * 뉴스 커버 업로드 (news/{newsId}/cover.webp)
 * 업로드된 경로 반환 (롤백용)
 */
export async function uploadNewsCover(
  client: SupabaseClient<Database>,
  newsId: string,
  file: File,
): Promise<{ publicUrl: string; path: string }> {
  const path = `${newsId}/cover.webp`;
  const publicUrl = await uploadToStorage(client, NEWS_BUCKET, path, file);
  return { publicUrl, path };
}

/**
 * 뉴스 최종 업데이트 (content_mdx, thumbnail_image_url, cover_image_urls)
 */
export async function updateNewsAfterUpload(
  client: SupabaseClient<Database>,
  newsId: string,
  payload: {
    contentMdx: string;
    thumbnailImageUrl: string | null;
    coverImageUrls: string[];
  },
): Promise<void> {
  const { error } = await client
    .from("news")
    .update({
      content_mdx: payload.contentMdx,
      thumbnail_image_url: payload.thumbnailImageUrl,
      cover_image_urls: payload.coverImageUrls,
    })
    .eq("id", newsId);

  if (error) {
    throw new Error(`뉴스 업데이트 실패: ${error.message}`);
  }
}

/**
 * 이번 요청에서 업로드한 경로만 삭제 (path.startsWith(newsId/))
 */
/**
 * 이번 요청에서 업로드한 경로만 삭제 (path.startsWith(newsId/) 검증)
 */
function removeUploadedNewsFiles(
  client: SupabaseClient<Database>,
  newsId: string,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return Promise.resolve();

  const prefix = `${newsId}/`;
  const safePaths = paths.filter((p) => p.startsWith(prefix));

  if (safePaths.length === 0) return Promise.resolve();

  return removeStorageFiles(client, NEWS_BUCKET, safePaths);
}

/**
 * 뉴스 생성 전체 흐름
 * 1. DB insert (썸네일·커버 제외)
 * 2. 썸네일 업로드
 * 3. 커버 업로드 (있을 경우)
 * 4. TEMP_IMAGE_xxx 업로드 + URL 치환
 * 5. DB update (content_mdx, thumbnail_image_url, cover_image_urls)
 * 실패 시: 이번 요청에서 업로드한 파일만 삭제 후 throw
 */
export async function createNews(
  client: SupabaseClient<Database>,
  params: {
    title: string;
    category: string;
    contentMdx: string;
    isPublished: boolean;
    visibility: "public" | "member";
    authorId: string | null;
    thumbnailFile: File | null;
    coverFile: File | null;
    contentImageFiles: File[];
    contentImageTempIds: string[];
  },
): Promise<string> {
  const slug = await generateUniqueSlugForNews(client, params.title);

  const newsId = await createNewsBase(client, {
    title: params.title,
    category: params.category,
    contentMdx: params.contentMdx,
    isPublished: params.isPublished,
    visibility: params.visibility,
    authorId: params.authorId,
    slug,
  });

  const uploadedPaths: string[] = [];

  try {
    let thumbnailImageUrl: string | null = null;
    if (params.thumbnailFile && params.thumbnailFile.size > 0) {
      const { publicUrl, path } = await uploadNewsThumbnail(
        client,
        newsId,
        params.thumbnailFile,
      );
      thumbnailImageUrl = publicUrl;
      uploadedPaths.push(path);
    }

    let coverImageUrls: string[] = [];
    if (params.coverFile && params.coverFile.size > 0) {
      const { publicUrl, path } = await uploadNewsCover(
        client,
        newsId,
        params.coverFile,
      );
      coverImageUrls = [publicUrl];
      uploadedPaths.push(path);
    }

    let finalContentMdx = params.contentMdx;
    if (
      params.contentImageFiles.length > 0 &&
      params.contentImageTempIds.length > 0
    ) {
      const { updatedContent, uploadedPaths: contentPaths } =
        await uploadContentImages(
          client,
          NEWS_BUCKET,
          newsId,
          params.contentMdx,
          params.contentImageFiles,
          params.contentImageTempIds,
        );
      finalContentMdx = updatedContent;
      uploadedPaths.push(...contentPaths);
    }

    await updateNewsAfterUpload(client, newsId, {
      contentMdx: finalContentMdx,
      thumbnailImageUrl,
      coverImageUrls,
    });

    return newsId;
  } catch (err) {
    await removeUploadedNewsFiles(client, newsId, uploadedPaths);
    try {
      await client.from("news").delete().eq("id", newsId);
    } catch {
      // DB 삭제 실패 시에도 업로드 파일은 이미 정리됨
    }
    throw err;
  }
}

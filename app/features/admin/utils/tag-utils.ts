/**
 * 태그 처리 유틸리티
 *
 * 클래스 생성/수정 시 태그를 처리하는 함수들을 제공합니다.
 * 태그 이름을 정규화하고, 기존 태그를 조회하거나 생성합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/**
 * 태그 이름을 정규화합니다.
 * - 앞뒤 공백 제거
 * - 빈 문자열 제거
 * - 중복 제거
 *
 * @param tagString - 쉼표로 구분된 태그 문자열
 * @returns 정규화된 태그 이름 배열
 */
export function normalizeTags(tagString: string): string[] {
  if (!tagString || !tagString.trim()) {
    return [];
  }

  return tagString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .filter((tag, index, array) => array.indexOf(tag) === index); // 중복 제거
}

/**
 * 태그 ID를 조회하거나 생성합니다.
 *
 * @param client - Supabase 클라이언트
 * @param tagName - 태그 이름
 * @returns 태그 ID
 */
export async function getOrCreateTag(
  client: SupabaseClient<Database>,
  tagName: string,
): Promise<string> {
  // 기존 태그 조회
  const { data: existingTag, error: selectError } = await client
    .from("tags")
    .select("id")
    .eq("name", tagName)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    // PGRST116은 "no rows returned" 에러이므로 무시
    throw new Error(`태그 조회 실패: ${selectError.message}`);
  }

  // 기존 태그가 있으면 반환
  if (existingTag) {
    return existingTag.id as string;
  }

  // 새 태그 생성
  // slug는 name을 기반으로 생성 (소문자, 공백을 하이픈으로)
  const slug = tagName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  const { data: newTag, error: insertError } = await client
    .from("tags")
    .insert({
      name: tagName,
      slug: slug,
      usage_count: 0,
    })
    .select("id")
    .single();

  if (insertError || !newTag) {
    throw new Error(`태그 생성 실패: ${insertError?.message || "알 수 없는 오류"}`);
  }

  return newTag.id as string;
}

/**
 * 클래스에 태그를 연결합니다.
 *
 * @param client - Supabase 클라이언트
 * @param classId - 클래스 ID
 * @param tagIds - 태그 ID 배열
 */
export async function linkTagsToClass(
  client: SupabaseClient<Database>,
  classId: string,
  tagIds: string[],
): Promise<void> {
  if (tagIds.length === 0) {
    return;
  }

  // class_tags 테이블에 연결 데이터 삽입
  const classTagsData = tagIds.map((tagId) => ({
    class_id: classId,
    tag_id: tagId,
  }));

  const { error } = await client.from("class_tags").insert(classTagsData);

  if (error) {
    throw new Error(`태그 연결 실패: ${error.message}`);
  }
}

/**
 * 클래스에 연결된 모든 태그 연결을 삭제합니다.
 * 수정 시 기존 태그를 제거한 뒤 재연결할 때 사용합니다.
 *
 * @param client - Supabase 클라이언트
 * @param classId - 클래스 ID
 */
export async function unlinkAllTagsFromClass(
  client: SupabaseClient<Database>,
  classId: string,
): Promise<void> {
  const { error } = await client
    .from("class_tags")
    .delete()
    .eq("class_id", classId);

  if (error) {
    throw new Error(`클래스 태그 연결 삭제 실패: ${error.message}`);
  }
}

/**
 * 태그 문자열을 처리하여 클래스에 연결합니다.
 *
 * @param client - Supabase 클라이언트
 * @param classId - 클래스 ID
 * @param tagString - 쉼표로 구분된 태그 문자열
 */
export async function processTagsForClass(
  client: SupabaseClient<Database>,
  classId: string,
  tagString: string,
): Promise<void> {
  // 태그 정규화
  const tagNames = normalizeTags(tagString);

  if (tagNames.length === 0) {
    return;
  }

  // 각 태그에 대해 ID 조회 또는 생성
  const tagIds = await Promise.all(
    tagNames.map((tagName) => getOrCreateTag(client, tagName)),
  );

  // 클래스에 태그 연결
  await linkTagsToClass(client, classId, tagIds);
}

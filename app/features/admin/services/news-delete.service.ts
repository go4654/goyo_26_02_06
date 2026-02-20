/**
 * 뉴스 삭제 서비스
 * 뉴스 Hard Delete 비즈니스 로직 (Storage 없음, FK CASCADE로 news_view_events 자동 삭제)
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

export interface NewsDeleteResult {
  newsId: string;
  success: boolean;
  error?: string;
}

/**
 * 뉴스 존재 여부 확인
 */
export async function checkNewsExists(
  client: SupabaseClient<Database>,
  newsId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("news")
    .select("id")
    .eq("id", newsId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * 단일 뉴스 Hard Delete
 * 존재 여부 확인 → DB DELETE (news_view_events는 FK CASCADE로 자동 삭제)
 */
export async function deleteNews(
  client: SupabaseClient<Database>,
  newsId: string,
): Promise<NewsDeleteResult> {
  const exists = await checkNewsExists(client, newsId);
  if (!exists) {
    return {
      newsId,
      success: false,
      error: "뉴스를 찾을 수 없습니다.",
    };
  }

  const { error: deleteError } = await client
    .from("news")
    .delete()
    .eq("id", newsId);

  if (deleteError) {
    return {
      newsId,
      success: false,
      error: `DB 삭제 실패: ${deleteError.message}`,
    };
  }

  return {
    newsId,
    success: true,
  };
}

/**
 * 여러 뉴스 삭제
 * 항목별 독립 처리, 하나 실패해도 나머지 계속 진행
 */
export async function deleteNewsBatch(
  client: SupabaseClient<Database>,
  newsIds: string[],
): Promise<NewsDeleteResult[]> {
  const results: NewsDeleteResult[] = [];

  for (const newsId of newsIds) {
    const result = await deleteNews(client, newsId);
    results.push(result);
  }

  return results;
}

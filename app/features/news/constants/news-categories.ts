/**
 * 뉴스 카테고리 상수 (클라이언트/서버 공용)
 * schema.ts의 news_category enum과 동기화. UI·폼·액션에서 사용.
 */

export const NEWS_CATEGORIES = ["notice", "update", "news"] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  notice: "공지",
  update: "업데이트",
  news: "뉴스",
};

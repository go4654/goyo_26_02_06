/**
 * 문의 카테고리 타입 및 라벨 (스키마 inquiry_category enum과 동기화)
 */
export type InquiryCategory = "general" | "class" | "gallery" | "account" | "etc";

/** 카테고리 한글 라벨 */
export const INQUIRY_CATEGORY_LABELS: Record<InquiryCategory, string> = {
  general: "일반 문의",
  class: "클래스 관련",
  gallery: "갤러리 관련",
  account: "계정/기술",
  etc: "기타",
};

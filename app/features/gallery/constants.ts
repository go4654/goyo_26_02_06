/**
 * 갤러리 카테고리 상수
 * 하드코딩 방지를 위해 단일 소스로 관리합니다.
 */
export const GALLERY_CATEGORIES = ["development", "design", "publishing"] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

/** 카테고리 표시 이름 매핑 */
export const GALLERY_CATEGORY_LABELS: Record<GalleryCategory, string> = {
  development: "Development",
  design: "Design",
  publishing: "Publishing",
};

/** 유효한 갤러리 카테고리인지 검사 */
export function isGalleryCategory(value: string): value is GalleryCategory {
  return GALLERY_CATEGORIES.includes(value as GalleryCategory);
}

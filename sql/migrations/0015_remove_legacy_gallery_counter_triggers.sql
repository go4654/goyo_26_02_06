/**
 * 데이터베이스 마이그레이션: 0015_remove_legacy_gallery_counter_triggers
 *
 * 목적:
 * - 과거에 수동으로 생성된 trg_gallery_* 트리거/함수가 남아있을 경우,
 *   신규 sync_gallery_* 트리거와 함께 실행되어 카운트가 2배로 증가하는 문제를 방지합니다.
 *
 * 방식:
 * - legacy 트리거(trg_gallery_*)를 모두 DROP 합니다.
 * - legacy 함수(increment/decrement_gallery_*_count)를 DROP 합니다.
 * - 마지막에 카운트를 한 번 더 재동기화하여 정합성을 확보합니다.
 */

-- =========================================
-- 1. Legacy 트리거 제거
-- =========================================
DROP TRIGGER IF EXISTS trg_gallery_like_insert ON public.gallery_likes;--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_gallery_like_delete ON public.gallery_likes;--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_gallery_save_insert ON public.gallery_saves;--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_gallery_save_delete ON public.gallery_saves;--> statement-breakpoint

-- =========================================
-- 2. Legacy 함수 제거
-- =========================================
DROP FUNCTION IF EXISTS public.increment_gallery_like_count();--> statement-breakpoint
DROP FUNCTION IF EXISTS public.decrement_gallery_like_count();--> statement-breakpoint
DROP FUNCTION IF EXISTS public.increment_gallery_save_count();--> statement-breakpoint
DROP FUNCTION IF EXISTS public.decrement_gallery_save_count();--> statement-breakpoint

-- =========================================
-- 3. 카운트 재동기화 (정합성 확보)
-- =========================================
UPDATE public.galleries
SET like_count = (
  SELECT COUNT(*)
  FROM public.gallery_likes
  WHERE public.gallery_likes.gallery_id = public.galleries.id
),
save_count = (
  SELECT COUNT(*)
  FROM public.gallery_saves
  WHERE public.gallery_saves.gallery_id = public.galleries.id
);


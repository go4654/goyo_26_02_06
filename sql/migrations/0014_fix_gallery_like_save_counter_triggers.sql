/**
 * 데이터베이스 마이그레이션: 0014_fix_gallery_like_save_counter_triggers
 *
 * 목적:
 * - gallery_likes / gallery_saves 변경 시 galleries.like_count / galleries.save_count가 최신 상태로 유지되도록 합니다.
 *
 * 방식:
 * - 트리거 함수(sync_gallery_like_count, sync_gallery_save_count)를 SECURITY DEFINER로 재정의합니다.
 * - 트리거를 DROP/CREATE로 재설치합니다. (여러 번 실행해도 안전)
 * - 마지막에 기존 데이터에 대해 카운트를 재동기화합니다.
 */

-- =========================================
-- 1. 좋아요 수 동기화 함수
-- =========================================
CREATE OR REPLACE FUNCTION public.sync_gallery_like_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.galleries
    SET like_count = like_count + 1
    WHERE id = NEW.gallery_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.galleries
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.gallery_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;--> statement-breakpoint

-- =========================================
-- 2. 저장 수 동기화 함수
-- =========================================
CREATE OR REPLACE FUNCTION public.sync_gallery_save_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.galleries
    SET save_count = save_count + 1
    WHERE id = NEW.gallery_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.galleries
    SET save_count = GREATEST(save_count - 1, 0)
    WHERE id = OLD.gallery_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;--> statement-breakpoint

-- =========================================
-- 3. 트리거 재설치 (idempotent)
-- =========================================
DROP TRIGGER IF EXISTS sync_gallery_like_count_insert ON public.gallery_likes;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_gallery_like_count_delete ON public.gallery_likes;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_gallery_save_count_insert ON public.gallery_saves;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_gallery_save_count_delete ON public.gallery_saves;--> statement-breakpoint

CREATE TRIGGER sync_gallery_like_count_insert
AFTER INSERT ON public.gallery_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_gallery_like_count();--> statement-breakpoint

CREATE TRIGGER sync_gallery_like_count_delete
AFTER DELETE ON public.gallery_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_gallery_like_count();--> statement-breakpoint

CREATE TRIGGER sync_gallery_save_count_insert
AFTER INSERT ON public.gallery_saves
FOR EACH ROW
EXECUTE FUNCTION public.sync_gallery_save_count();--> statement-breakpoint

CREATE TRIGGER sync_gallery_save_count_delete
AFTER DELETE ON public.gallery_saves
FOR EACH ROW
EXECUTE FUNCTION public.sync_gallery_save_count();--> statement-breakpoint

-- =========================================
-- 4. 기존 데이터 카운트 재동기화
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


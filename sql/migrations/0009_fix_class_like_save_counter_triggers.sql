/**
 * 데이터베이스 마이그레이션: 0009_fix_class_like_save_counter_triggers
 *
 * 목적:
 * - class_likes / class_saves 변경 시 classes.like_count / classes.save_count가 갱신되지 않는 문제를 방지합니다.
 *
 * 방식:
 * - 트리거 함수(sync_class_like_count, sync_class_save_count)를 schema-qualified 쿼리로 재정의합니다.
 * - 트리거를 DROP/CREATE로 재설치합니다.
 * - 마지막에 기존 데이터에 대해 카운트를 재동기화합니다.
 */

-- =========================================
-- 1. 좋아요 수 동기화 함수 (schema-qualified)
-- =========================================
CREATE OR REPLACE FUNCTION public.sync_class_like_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.classes
    SET like_count = like_count + 1
    WHERE id = NEW.class_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.classes
    SET like_count = like_count - 1
    WHERE id = OLD.class_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;--> statement-breakpoint

-- =========================================
-- 2. 저장 수 동기화 함수 (schema-qualified)
-- =========================================
CREATE OR REPLACE FUNCTION public.sync_class_save_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.classes
    SET save_count = save_count + 1
    WHERE id = NEW.class_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.classes
    SET save_count = save_count - 1
    WHERE id = OLD.class_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;--> statement-breakpoint

-- =========================================
-- 3. 트리거 재설치 (idempotent)
-- =========================================
DROP TRIGGER IF EXISTS sync_class_like_count_insert ON public.class_likes;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_class_like_count_delete ON public.class_likes;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_class_save_count_insert ON public.class_saves;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_class_save_count_delete ON public.class_saves;--> statement-breakpoint

CREATE TRIGGER sync_class_like_count_insert
AFTER INSERT ON public.class_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_like_count();--> statement-breakpoint

CREATE TRIGGER sync_class_like_count_delete
AFTER DELETE ON public.class_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_like_count();--> statement-breakpoint

CREATE TRIGGER sync_class_save_count_insert
AFTER INSERT ON public.class_saves
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_save_count();--> statement-breakpoint

CREATE TRIGGER sync_class_save_count_delete
AFTER DELETE ON public.class_saves
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_save_count();--> statement-breakpoint

-- =========================================
-- 4. 기존 데이터 카운트 재동기화
-- =========================================
UPDATE public.classes
SET like_count = (
  SELECT COUNT(*)
  FROM public.class_likes
  WHERE public.class_likes.class_id = public.classes.id
),
save_count = (
  SELECT COUNT(*)
  FROM public.class_saves
  WHERE public.class_saves.class_id = public.classes.id
)
WHERE is_deleted = false;


/**
 * 데이터베이스 마이그레이션: 0016_reset_gallery_counter_triggers
 *
 * 배경:
 * - 0014/0015 이후에도 like_count/save_count가 2배로 증가하는 경우,
 *   이름이 다른 레거시 트리거가 남아있어 중복 실행되는 케이스가 있습니다.
 *
 * 목적:
 * - public.gallery_likes / public.gallery_saves에 걸린 사용자 트리거를 전부 제거한 뒤,
 *   우리가 의도한 sync_gallery_* 트리거만 다시 설치하여 "중복 카운트"를 원천 차단합니다.
 *
 * 주의:
 * - 이 마이그레이션은 gallery_likes/gallery_saves 테이블의 트리거를 리셋합니다.
 * - 이후 카운트를 한 번 더 백필하여 정합성을 맞춥니다.
 */

-- =========================================
-- 1. gallery_likes 트리거 전체 제거 (내부 트리거 제외)
-- =========================================
DO $$
DECLARE
  trg RECORD;
BEGIN
  FOR trg IN
    SELECT t.tgname
    FROM pg_trigger t
    WHERE t.tgrelid = 'public.gallery_likes'::regclass
      AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.gallery_likes;', trg.tgname);
  END LOOP;
END $$;--> statement-breakpoint

-- =========================================
-- 2. gallery_saves 트리거 전체 제거 (내부 트리거 제외)
-- =========================================
DO $$
DECLARE
  trg RECORD;
BEGIN
  FOR trg IN
    SELECT t.tgname
    FROM pg_trigger t
    WHERE t.tgrelid = 'public.gallery_saves'::regclass
      AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.gallery_saves;', trg.tgname);
  END LOOP;
END $$;--> statement-breakpoint

-- =========================================
-- 3. 카운터 동기화 함수 재정의 (안전 설정 포함)
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
-- 4. 트리거 재설치 (정상 상태 2개씩만 존재)
-- =========================================
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
-- 5. 카운트 백필 (정합성 확보)
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


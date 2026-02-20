-- ============================================================
-- 클래스 좋아요 수 트리거 (Supabase SQL Editor에서 전체 실행)
-- ============================================================
-- class_likes INSERT/DELETE 시 classes.like_count 자동 동기화
-- SET SEARCH_PATH = '' 이므로 반드시 public.classes 사용
-- ============================================================

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
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE id = OLD.class_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

-- 트리거 재설치 (기존 트리거 제거 후 생성)
DROP TRIGGER IF EXISTS sync_class_like_count_insert ON public.class_likes;
DROP TRIGGER IF EXISTS sync_class_like_count_delete ON public.class_likes;

CREATE TRIGGER sync_class_like_count_insert
AFTER INSERT ON public.class_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_like_count();

CREATE TRIGGER sync_class_like_count_delete
AFTER DELETE ON public.class_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_like_count();

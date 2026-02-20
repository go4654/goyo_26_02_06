-- ============================================================
-- 클래스 조회수 트리거 (Supabase SQL Editor에서 전체 실행)
-- ============================================================
-- class_view_events INSERT 시 classes.view_count 자동 증가
-- SET SEARCH_PATH = '' 이므로 반드시 public.classes 사용
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_class_view_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
    UPDATE public.classes
    SET view_count = view_count + 1
    WHERE id = NEW.class_id;

    RETURN NEW;
END;
$$;

-- 트리거 재설치 (기존 트리거 제거 후 생성)
DROP TRIGGER IF EXISTS increment_class_view_count ON public.class_view_events;

CREATE TRIGGER increment_class_view_count
AFTER INSERT ON public.class_view_events
FOR EACH ROW
EXECUTE FUNCTION public.increment_class_view_count();

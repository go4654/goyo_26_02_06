/**
 * 데이터베이스 마이그레이션: 0004_add_class_counter_triggers
 * 
 * 이 마이그레이션은 classes 테이블의 카운터 필드를 자동으로 유지하기 위한
 * 데이터베이스 트리거와 함수를 추가합니다:
 * 
 * 1. view_count: class_view_events 레코드가 삽입될 때 자동 증가
 * 2. comment_count: class_comments가 삽입/삭제/soft-deleted될 때 자동 동기화
 * 3. like_count: class_likes가 삽입/삭제될 때 자동 동기화
 * 4. save_count: class_saves가 삽입/삭제될 때 자동 동기화
 * 5. generate_slug: 텍스트에서 URL 친화적인 slug를 생성하는 헬퍼 함수
 * 
 * 이러한 자동화된 데이터베이스 기능은 데이터 일관성을 보장하고
 * 애플리케이션 코드에서 카운터 필드를 수동으로 유지할 필요를 줄입니다.
 */

-- =========================================
-- 1. 조회수 증가 함수
-- =========================================
CREATE OR REPLACE FUNCTION public.increment_class_view_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
    UPDATE classes
    SET view_count = view_count + 1
    WHERE id = NEW.class_id;
    
    RETURN NEW;
END;
$$;--> statement-breakpoint

-- =========================================
-- 2. 댓글 수 동기화 함수
-- =========================================
CREATE OR REPLACE FUNCTION public.sync_class_comment_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
DECLARE
    delta INTEGER;
    class_uuid UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        class_uuid := NEW.class_id;
        delta := 1;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.is_deleted = false THEN
            class_uuid := OLD.class_id;
            delta := -1;
        ELSE
            RETURN OLD;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        class_uuid := NEW.class_id;
        IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
            delta := -1;
        ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
            delta := 1;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    
    UPDATE classes
    SET comment_count = comment_count + delta
    WHERE id = class_uuid;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;--> statement-breakpoint

-- =========================================
-- 3. 좋아요 수 동기화 함수
-- =========================================
CREATE OR REPLACE FUNCTION public.sync_class_like_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE classes
        SET like_count = like_count + 1
        WHERE id = NEW.class_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE classes
        SET like_count = like_count - 1
        WHERE id = OLD.class_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;--> statement-breakpoint

-- =========================================
-- 4. 저장 수 동기화 함수
-- =========================================
CREATE OR REPLACE FUNCTION public.sync_class_save_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE classes
        SET save_count = save_count + 1
        WHERE id = NEW.class_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE classes
        SET save_count = save_count - 1
        WHERE id = OLD.class_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;--> statement-breakpoint

-- =========================================
-- 5. 슬러그 생성 함수
-- =========================================
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
DECLARE
    slug TEXT;
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN NULL;
    END IF;
    
    slug := LOWER(input_text);
    slug := REGEXP_REPLACE(slug, '[^\w\s-]', '', 'g');
    slug := REGEXP_REPLACE(slug, '\s+', '-', 'g');
    slug := REGEXP_REPLACE(slug, '-+', '-', 'g');
    slug := TRIM(BOTH '-' FROM slug);
    
    IF slug = '' OR slug IS NULL THEN
        slug := 'untitled-' || EXTRACT(EPOCH FROM NOW())::TEXT;
    END IF;
    
    RETURN slug;
END;
$$;--> statement-breakpoint

-- =========================================
-- 조회수 트리거
-- =========================================
CREATE TRIGGER increment_class_view_count
AFTER INSERT ON class_view_events
FOR EACH ROW
EXECUTE FUNCTION public.increment_class_view_count();--> statement-breakpoint

-- =========================================
-- 댓글 수 트리거들
-- =========================================
CREATE TRIGGER sync_class_comment_count_insert
AFTER INSERT ON class_comments
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_comment_count();--> statement-breakpoint

CREATE TRIGGER sync_class_comment_count_delete
AFTER DELETE ON class_comments
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_comment_count();--> statement-breakpoint

CREATE TRIGGER sync_class_comment_count_update
AFTER UPDATE OF is_deleted ON class_comments
FOR EACH ROW
WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
EXECUTE FUNCTION public.sync_class_comment_count();--> statement-breakpoint

-- =========================================
-- 좋아요 수 트리거들
-- =========================================
CREATE TRIGGER sync_class_like_count_insert
AFTER INSERT ON class_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_like_count();--> statement-breakpoint

CREATE TRIGGER sync_class_like_count_delete
AFTER DELETE ON class_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_like_count();--> statement-breakpoint

-- =========================================
-- 저장 수 트리거들
-- =========================================
CREATE TRIGGER sync_class_save_count_insert
AFTER INSERT ON class_saves
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_save_count();--> statement-breakpoint

CREATE TRIGGER sync_class_save_count_delete
AFTER DELETE ON class_saves
FOR EACH ROW
EXECUTE FUNCTION public.sync_class_save_count();--> statement-breakpoint

-- =========================================
-- 기존 데이터의 카운터 초기화
-- =========================================
-- 기존 댓글 수 동기화
UPDATE classes
SET comment_count = (
    SELECT COUNT(*)
    FROM class_comments
    WHERE class_comments.class_id = classes.id
    AND class_comments.is_deleted = false
);--> statement-breakpoint

-- 기존 좋아요 수 동기화
UPDATE classes
SET like_count = (
    SELECT COUNT(*)
    FROM class_likes
    WHERE class_likes.class_id = classes.id
);--> statement-breakpoint

-- 기존 저장 수 동기화
UPDATE classes
SET save_count = (
    SELECT COUNT(*)
    FROM class_saves
    WHERE class_saves.class_id = classes.id
);--> statement-breakpoint

-- 기존 조회수 동기화
UPDATE classes
SET view_count = (
    SELECT COUNT(*)
    FROM class_view_events
    WHERE class_view_events.class_id = classes.id
);

/**
 * 데이터베이스 트리거 함수: sync_class_comment_count
 * 
 * 이 함수는 댓글이 삽입, 삭제 또는 soft-deleted(is_deleted 플래그 변경)될 때
 * classes 테이블의 comment_count를 자동으로 증가/감소시켜 유지합니다.
 * 
 * 세 가지 시나리오를 처리합니다:
 * 1. INSERT: 새 댓글에 대해 카운트 증가
 * 2. DELETE: 댓글이 hard delete될 때 카운트 감소
 * 3. UPDATE: is_deleted 플래그가 변경될 때 카운트 조정 (soft delete/복원)
 * 
 * 보안 고려사항:
 * - SECURITY DEFINER를 사용하여 함수 소유자의 권한으로 실행
 * - 빈 search_path 설정으로 search path injection 공격 방지
 * 
 * 사용법:
 * CREATE TRIGGER sync_class_comment_count_insert
 * AFTER INSERT ON class_comments
 * FOR EACH ROW
 * EXECUTE FUNCTION public.sync_class_comment_count();
 * 
 * CREATE TRIGGER sync_class_comment_count_delete
 * AFTER DELETE ON class_comments
 * FOR EACH ROW
 * EXECUTE FUNCTION public.sync_class_comment_count();
 * 
 * CREATE TRIGGER sync_class_comment_count_update
 * AFTER UPDATE OF is_deleted ON class_comments
 * FOR EACH ROW
 * WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
 * EXECUTE FUNCTION public.sync_class_comment_count();
 * 
 * @returns TRIGGER - NEW 레코드(INSERT/UPDATE) 또는 OLD 레코드(DELETE)를 반환
 */
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
    -- 트리거 작업에 따라 class_id와 delta 결정
    IF TG_OP = 'INSERT' THEN
        -- 새 댓글: 카운트 증가
        class_uuid := NEW.class_id;
        delta := 1;
    ELSIF TG_OP = 'DELETE' THEN
        -- Hard delete: 카운트 감소 (이미 soft-deleted가 아닌 경우만)
        IF OLD.is_deleted = false THEN
            class_uuid := OLD.class_id;
            delta := -1;
        ELSE
            -- 이미 soft-deleted 상태이므로 변경 불필요
            RETURN OLD;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Soft delete/복원: is_deleted 변경에 따라 카운트 조정
        class_uuid := NEW.class_id;
        IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
            -- Soft delete: 감소
            delta := -1;
        ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
            -- 복원: 증가
            delta := 1;
        ELSE
            -- is_deleted 상태 변경 없음
            RETURN NEW;
        END IF;
    END IF;
    
    -- 클래스의 comment_count 업데이트
    UPDATE classes
    SET comment_count = comment_count + delta
    WHERE id = class_uuid;
    
    -- 적절한 레코드 반환
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

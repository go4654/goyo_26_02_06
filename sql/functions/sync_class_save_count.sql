/**
 * 데이터베이스 트리거 함수: sync_class_save_count
 * 
 * 이 함수는 저장이 삽입되거나 삭제될 때 classes 테이블의 save_count를
 * 자동으로 증가/감소시켜 유지합니다.
 * 
 * 두 가지 시나리오를 처리합니다:
 * 1. INSERT: 저장이 추가될 때 카운트 증가
 * 2. DELETE: 저장이 제거될 때 카운트 감소
 * 
 * 보안 고려사항:
 * - SECURITY DEFINER를 사용하여 함수 소유자의 권한으로 실행
 * - 빈 search_path 설정으로 search path injection 공격 방지
 * 
 * 사용법:
 * CREATE TRIGGER sync_class_save_count_insert
 * AFTER INSERT ON class_saves
 * FOR EACH ROW
 * EXECUTE FUNCTION public.sync_class_save_count();
 * 
 * CREATE TRIGGER sync_class_save_count_delete
 * AFTER DELETE ON class_saves
 * FOR EACH ROW
 * EXECUTE FUNCTION public.sync_class_save_count();
 * 
 * @returns TRIGGER - NEW 레코드(INSERT) 또는 OLD 레코드(DELETE)를 반환
 */
CREATE OR REPLACE FUNCTION public.sync_class_save_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 저장이 추가될 때 save_count 증가
        UPDATE classes
        SET save_count = save_count + 1
        WHERE id = NEW.class_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- 저장이 제거될 때 save_count 감소
        UPDATE classes
        SET save_count = save_count - 1
        WHERE id = OLD.class_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

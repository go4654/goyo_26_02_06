/**
 * 데이터베이스 트리거 함수: increment_class_view_count
 * 
 * 이 함수는 class_view_events 테이블에 새로운 조회 이벤트가 삽입될 때마다
 * classes 테이블의 view_count를 자동으로 증가시킵니다.
 * 
 * 이를 통해 조회수는 항상 조회 이벤트와 동기화되며,
 * 애플리케이션 레벨 업데이트 없이 실시간 조회 통계를 제공합니다.
 * 
 * 보안 고려사항:
 * - SECURITY DEFINER를 사용하여 함수 소유자의 권한으로 실행
 * - 빈 search_path 설정으로 search path injection 공격 방지
 * 
 * 사용법:
 * CREATE TRIGGER increment_class_view_count
 * AFTER INSERT ON class_view_events
 * FOR EACH ROW
 * EXECUTE FUNCTION public.increment_class_view_count();
 * 
 * @returns TRIGGER - 함수를 트리거한 NEW 레코드를 반환
 */
CREATE OR REPLACE FUNCTION public.increment_class_view_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
    -- 클래스의 view_count 증가
    UPDATE classes
    SET view_count = view_count + 1
    WHERE id = NEW.class_id;
    
    RETURN NEW;
END;
$$;

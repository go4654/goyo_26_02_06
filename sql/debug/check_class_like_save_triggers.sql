-- 클래스 좋아요/저장 트리거 확인 스크립트
-- 트리거가 제대로 설정되어 있는지 확인합니다.

-- 1. 트리거 함수 존재 확인
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname IN ('sync_class_like_count', 'sync_class_save_count')
ORDER BY proname;

-- 2. 트리거 존재 확인
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname IN (
  'sync_class_like_count_insert',
  'sync_class_like_count_delete',
  'sync_class_save_count_insert',
  'sync_class_save_count_delete'
)
ORDER BY tgname;

-- 3. 테스트: 좋아요 추가 후 카운트 확인
-- (실제 테스트는 수동으로 수행)
-- INSERT INTO class_likes (class_id, user_id) VALUES ('class-uuid', 'user-uuid');
-- SELECT like_count FROM classes WHERE id = 'class-uuid';

-- 4. 현재 카운트와 실제 레코드 수 비교
SELECT 
  c.id,
  c.title,
  c.like_count as db_like_count,
  (SELECT COUNT(*) FROM class_likes WHERE class_id = c.id) as actual_like_count,
  c.save_count as db_save_count,
  (SELECT COUNT(*) FROM class_saves WHERE class_id = c.id) as actual_save_count,
  CASE 
    WHEN c.like_count != (SELECT COUNT(*) FROM class_likes WHERE class_id = c.id) 
    THEN 'MISMATCH'
    ELSE 'OK'
  END as like_status,
  CASE 
    WHEN c.save_count != (SELECT COUNT(*) FROM class_saves WHERE class_id = c.id) 
    THEN 'MISMATCH'
    ELSE 'OK'
  END as save_status
FROM classes c
WHERE c.is_deleted = false
ORDER BY c.created_at DESC
LIMIT 10;

-- 트리거 테스트 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. 트리거 함수 존재 확인
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname IN ('sync_class_like_count', 'sync_class_save_count')
ORDER BY proname;

-- 2. 트리거 존재 및 활성화 상태 확인
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled,
  tgtype as trigger_type
FROM pg_trigger 
WHERE tgname IN (
  'sync_class_like_count_insert',
  'sync_class_like_count_delete',
  'sync_class_save_count_insert',
  'sync_class_save_count_delete'
)
ORDER BY tgname;

-- 3. 현재 카운트와 실제 레코드 수 비교
SELECT 
  c.id,
  c.title,
  c.like_count as db_like_count,
  (SELECT COUNT(*) FROM class_likes WHERE class_id = c.id) as actual_like_count,
  c.save_count as db_save_count,
  (SELECT COUNT(*) FROM class_saves WHERE class_id = c.id) as actual_save_count,
  CASE 
    WHEN c.like_count != (SELECT COUNT(*) FROM class_likes WHERE class_id = c.id)
    THEN '❌ MISMATCH'
    ELSE '✅ OK'
  END as like_status,
  CASE 
    WHEN c.save_count != (SELECT COUNT(*) FROM class_saves WHERE class_id = c.id)
    THEN '❌ MISMATCH'
    ELSE '✅ OK'
  END as save_status
FROM classes c
WHERE c.is_deleted = false
ORDER BY c.created_at DESC
LIMIT 10;

-- 4. 트리거가 작동하지 않는 경우 수동 동기화
-- 아래 주석을 해제하고 실행하면 카운트를 수동으로 동기화합니다
/*
UPDATE classes
SET like_count = (
  SELECT COUNT(*) 
  FROM class_likes 
  WHERE class_id = classes.id
),
save_count = (
  SELECT COUNT(*) 
  FROM class_saves 
  WHERE class_id = classes.id
)
WHERE is_deleted = false;
*/

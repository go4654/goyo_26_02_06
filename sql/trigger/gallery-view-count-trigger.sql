-- =========================================
-- 1. view_count 증가 함수
-- =========================================
CREATE OR REPLACE FUNCTION increment_gallery_view_count()
RETURNS trigger AS $$
BEGIN
  UPDATE galleries
  SET view_count = view_count + 1
  WHERE id = NEW.gallery_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 2. 트리거 생성
-- =========================================
DROP TRIGGER IF EXISTS trigger_increment_gallery_view_count
ON gallery_view_events;

CREATE TRIGGER trigger_increment_gallery_view_count
AFTER INSERT ON gallery_view_events
FOR EACH ROW
EXECUTE FUNCTION increment_gallery_view_count();


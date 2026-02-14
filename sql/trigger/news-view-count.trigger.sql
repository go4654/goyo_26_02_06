-- =========================================
-- 1. view_count 증가 함수
-- =========================================
CREATE OR REPLACE FUNCTION increment_news_view_count()
RETURNS trigger AS $$
BEGIN
  UPDATE news
  SET view_count = view_count + 1
  WHERE id = NEW.news_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 2. 트리거 생성
-- =========================================
DROP TRIGGER IF EXISTS trigger_increment_news_view_count
ON news_view_events;

CREATE TRIGGER trigger_increment_news_view_count
AFTER INSERT ON news_view_events
FOR EACH ROW
EXECUTE FUNCTION increment_news_view_count();

-- usage_count 컬럼 먼저 확인
usage_count integer NOT NULL DEFAULT 0

-- 없으면 먼저 추가
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0;

--  증가 함수
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS trigger AS $$
BEGIN
  UPDATE tags
  SET usage_count = usage_count + 1
  WHERE id = NEW.tag_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 감소 함수
CREATE OR REPLACE FUNCTION decrement_tag_usage()
RETURNS trigger AS $$
BEGIN
  UPDATE tags
  SET usage_count = GREATEST(usage_count - 1, 0)
  WHERE id = OLD.tag_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- GREATEST 쓰는 이유
-- 음수 방지

-- INSERT 트리거
DROP TRIGGER IF EXISTS class_tags_increment_usage ON class_tags;

CREATE TRIGGER class_tags_increment_usage
AFTER INSERT ON class_tags
FOR EACH ROW
EXECUTE FUNCTION increment_tag_usage();

-- DELETE 트리거
DROP TRIGGER IF EXISTS class_tags_decrement_usage ON class_tags;

CREATE TRIGGER class_tags_decrement_usage
AFTER DELETE ON class_tags
FOR EACH ROW
EXECUTE FUNCTION decrement_tag_usage();

-- 동작 확인 테스트
INSERT INTO class_tags (class_id, tag_id)
VALUES ('클래스uuid', '태그uuid');
-- → tags.usage_count +1 되는지 확인



DELETE FROM class_tags
WHERE class_id = '클래스uuid'
AND tag_id = '태그uuid';
-- → usage_count -1 되는지 확인


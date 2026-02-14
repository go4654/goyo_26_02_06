-- =============================================
-- 1️⃣ LIKE COUNT 증가 함수
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_gallery_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE galleries
  SET like_count = like_count + 1
  WHERE id = NEW.gallery_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2️⃣ LIKE COUNT 감소 함수
-- =============================================
CREATE OR REPLACE FUNCTION public.decrement_gallery_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE galleries
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE id = OLD.gallery_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3️⃣ LIKE 트리거
-- =============================================
DROP TRIGGER IF EXISTS trg_gallery_like_insert ON gallery_likes;
DROP TRIGGER IF EXISTS trg_gallery_like_delete ON gallery_likes;

CREATE TRIGGER trg_gallery_like_insert
AFTER INSERT ON gallery_likes
FOR EACH ROW
EXECUTE FUNCTION public.increment_gallery_like_count();

CREATE TRIGGER trg_gallery_like_delete
AFTER DELETE ON gallery_likes
FOR EACH ROW
EXECUTE FUNCTION public.decrement_gallery_like_count();



-- =============================================
-- 4️⃣ SAVE COUNT 증가 함수
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_gallery_save_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE galleries
  SET save_count = save_count + 1
  WHERE id = NEW.gallery_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5️⃣ SAVE COUNT 감소 함수
-- =============================================
CREATE OR REPLACE FUNCTION public.decrement_gallery_save_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE galleries
  SET save_count = GREATEST(save_count - 1, 0)
  WHERE id = OLD.gallery_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6️⃣ SAVE 트리거
-- =============================================
DROP TRIGGER IF EXISTS trg_gallery_save_insert ON gallery_saves;
DROP TRIGGER IF EXISTS trg_gallery_save_delete ON gallery_saves;

CREATE TRIGGER trg_gallery_save_insert
AFTER INSERT ON gallery_saves
FOR EACH ROW
EXECUTE FUNCTION public.increment_gallery_save_count();

CREATE TRIGGER trg_gallery_save_delete
AFTER DELETE ON gallery_saves
FOR EACH ROW
EXECUTE FUNCTION public.decrement_gallery_save_count();


-- 테스트 코드

-- 좋아요 추가
INSERT INTO gallery_likes (gallery_id, user_id)
VALUES ('갤러리UUID', '유저UUID');

-- galleries.like_count 증가 확인

-- 좋아요 삭제
DELETE FROM gallery_likes
WHERE gallery_id = '갤러리UUID'
AND user_id = '유저UUID';

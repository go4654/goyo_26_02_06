-- =============================================================================
-- 저장한 클래스 / 저장한 갤러리 목록 (offset + limit 페이지네이션)
-- Supabase SQL Editor에 붙여넣기 후 실행
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1️⃣ get_saved_classes(user_uuid uuid, page_limit int, page_offset int)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_saved_classes(uuid, int, int);

CREATE OR REPLACE FUNCTION public.get_saved_classes(
  p_user_uuid uuid,
  p_page_limit int DEFAULT 20,
  p_page_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  category text,
  thumbnail_image_url text,
  saved_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    c.id,
    c.title,
    c.slug,
    c.category,
    c.thumbnail_image_url,
    cs.created_at AS saved_at
  FROM public.class_saves cs
  JOIN public.classes c ON c.id = cs.class_id
  WHERE cs.user_id = p_user_uuid
    AND c.is_deleted = false
    AND c.is_published = true
  ORDER BY cs.created_at DESC
  LIMIT greatest(p_page_limit, 0)
  OFFSET greatest(p_page_offset, 0);
$$;

-- -----------------------------------------------------------------------------
-- 2️⃣ get_saved_galleries(user_uuid uuid, page_limit int, page_offset int)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_saved_galleries(uuid, int, int);

CREATE OR REPLACE FUNCTION public.get_saved_galleries(
  p_user_uuid uuid,
  p_page_limit int DEFAULT 20,
  p_page_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  category text,
  thumbnail_image_url text,
  saved_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    g.id,
    g.title,
    g.slug,
    g.category,
    g.thumbnail_image_url,
    gs.created_at AS saved_at
  FROM public.gallery_saves gs
  JOIN public.galleries g ON g.id = gs.gallery_id
  WHERE gs.user_id = p_user_uuid
    AND g.is_published = true
  ORDER BY gs.created_at DESC
  LIMIT greatest(p_page_limit, 0)
  OFFSET greatest(p_page_offset, 0);
$$;

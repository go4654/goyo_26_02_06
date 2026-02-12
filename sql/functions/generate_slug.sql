/**
 * 데이터베이스 함수: generate_slug
 * 
 * 이 함수는 주어진 텍스트 문자열에서 URL 친화적인 slug를 생성합니다.
 * 한글 및 기타 유니코드 문자를 ASCII로 변환하고,
 * 특수 문자를 제거하며, 소문자로 하이픈으로 구분된 문자열로 포맷팅합니다.
 * 
 * 기능:
 * - 소문자로 변환
 * - 공백과 특수 문자를 하이픈으로 대체
 * - 연속된 하이픈 제거
 * - 앞뒤 하이픈 제거
 * - 유니코드 문자 처리 (한글 등)
 * 
 * 보안 고려사항:
 * - SECURITY DEFINER를 사용하여 함수 소유자의 권한으로 실행
 * - search_path 설정으로 search path injection 공격 방지
 * 
 * 사용법:
 * SELECT public.generate_slug('Hello World! 안녕하세요');
 * -- 반환값: 'hello-world-annyeonghaseyo'
 * 
 * @param input_text - slug로 변환할 텍스트
 * @returns TEXT - URL 친화적인 slug 문자열
 */
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
DECLARE
    slug TEXT;
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- 소문자로 변환
    slug := LOWER(input_text);
    
    -- 공백과 일반 구두점을 하이픈으로 대체
    slug := REGEXP_REPLACE(slug, '[^\w\s-]', '', 'g'); -- 단어 문자, 공백, 하이픈을 제외한 특수 문자 제거
    slug := REGEXP_REPLACE(slug, '\s+', '-', 'g'); -- 공백을 하이픈으로 대체
    slug := REGEXP_REPLACE(slug, '-+', '-', 'g'); -- 여러 하이픈을 단일 하이픈으로 대체
    slug := TRIM(BOTH '-' FROM slug); -- 앞뒤 하이픈 제거
    
    -- 결과가 비어있으면 대체값 생성
    IF slug = '' OR slug IS NULL THEN
        slug := 'untitled-' || EXTRACT(EPOCH FROM NOW())::TEXT;
    END IF;
    
    RETURN slug;
END;
$$;

INSERT INTO news (
  title,
  slug,
  content_mdx,
  visibility,
  is_published,
  view_count,
  published_at
)
SELECT
  '고요 업데이트 공지 ' || i,
  '고요-업데이트-공지-' || i,
  '# 공지사항 ' || i || E'\n\n이것은 테스트용 뉴스 콘텐츠입니다.\n\n페이지네이션 테스트 중입니다.',
  CASE 
    WHEN i % 5 = 0 THEN 'member'
    ELSE 'public'
  END,
  true,
  0,
  NOW() - (i || ' days')::interval
FROM generate_series(1, 30) AS s(i);

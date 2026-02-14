INSERT INTO galleries (
  title,
  category,
  subtitle,
  description,
  caption,
  thumbnail_image_url,
  image_urls,
  slug,
  is_published
)
VALUES
-- ==============================
-- DESIGN
-- ==============================
(
  '브랜드 사이트 리뉴얼',
  'design',
  '기존 쇼핑몰 UI 개선 프로젝트',
  '사용성 개선 중심 리디자인',
  'Figma 기반 프로토타입 제작',
  'https://picsum.photos/seed/g1/600/400',
  ARRAY[
    'https://picsum.photos/seed/g1a/1200/800',
    'https://picsum.photos/seed/g1b/1200/800'
  ],
  '브랜드-사이트-리뉴얼',
  true
),

(
  '모바일 앱 UX 개선',
  'design',
  '금융 앱 사용성 개선',
  '사용자 플로우 단순화 작업',
  'UX 리서치 기반 설계',
  'https://picsum.photos/seed/g2/600/400',
  ARRAY[
    'https://picsum.photos/seed/g2a/1200/800',
    'https://picsum.photos/seed/g2b/1200/800'
  ],
  '모바일-앱-ux-개선',
  true
),

-- ==============================
-- DEVELOPMENT
-- ==============================
(
  'React 기반 쇼핑몰 제작',
  'development',
  'SPA 쇼핑몰 프로젝트',
  'React + Supabase 기반',
  '결제 기능 포함',
  'https://picsum.photos/seed/g3/600/400',
  ARRAY[
    'https://picsum.photos/seed/g3a/1200/800',
    'https://picsum.photos/seed/g3b/1200/800'
  ],
  'react-기반-쇼핑몰-제작',
  true
),

(
  'API 서버 구축',
  'development',
  'Node 기반 REST API',
  'JWT 인증 포함',
  '관리자 대시보드 연동',
  'https://picsum.photos/seed/g4/600/400',
  ARRAY[
    'https://picsum.photos/seed/g4a/1200/800'
  ],
  'api-서버-구축',
  true
),

-- ==============================
-- PUBLISHING
-- ==============================
(
  '반응형 웹 퍼블리싱',
  'publishing',
  'HTML/CSS 반응형 구현',
  'Grid / Flexbox 기반',
  '모바일 대응',
  'https://picsum.photos/seed/g5/600/400',
  ARRAY[
    'https://picsum.photos/seed/g5a/1200/800'
  ],
  '반응형-웹-퍼블리싱',
  true
),

(
  '기업 홈페이지 제작',
  'publishing',
  '기업 랜딩 페이지 제작',
  'SEO 최적화',
  '정적 사이트 구조',
  'https://picsum.photos/seed/g6/600/400',
  ARRAY[
    'https://picsum.photos/seed/g6a/1200/800'
  ],
  '기업-홈페이지-제작',
  true
);



INSERT INTO galleries (
  title,
  category,
  thumbnail_image_url,
  image_urls,
  slug,
  is_published
)
SELECT
  '테스트 갤러리 ' || gs,
  CASE 
    WHEN gs % 3 = 0 THEN 'design'
    WHEN gs % 3 = 1 THEN 'development'
    ELSE 'publishing'
  END,
  'https://picsum.photos/seed/test' || gs || '/600/400',
  ARRAY[
    'https://picsum.photos/seed/test' || gs || 'a/1200/800'
  ],
  '테스트-갤러리-' || gs,
  true
FROM generate_series(1,20) AS gs;

INSERT INTO galleries (
  title,
  subtitle,
  description,
  caption,
  slug,
  thumbnail_image_url,
  image_urls,
  view_count,
  like_count,
  save_count,
  is_published
)
VALUES
-- ================================
-- FIGMA 포트폴리오
-- ================================
('피그마 랜딩페이지 리디자인',
 '모바일 퍼스트 UI 설계',
 '기존 랜딩페이지를 UX 개선 중심으로 재설계한 프로젝트입니다.',
 '학생 포트폴리오 예시',
 '피그마-랜딩페이지-리디자인',
 'https://picsum.photos/seed/g1/600/400',
 ARRAY['https://picsum.photos/seed/g1a/1200/800','https://picsum.photos/seed/g1b/1200/800'],
 142, 23, 12, true),

('피그마 커머스 앱 UI',
 '이커머스 UX 흐름 설계',
 '구매 전환율을 높이기 위한 UI 설계 프로젝트.',
 'Figma 기반 실습',
 '피그마-커머스-앱-ui',
 'https://picsum.photos/seed/g2/600/400',
 ARRAY['https://picsum.photos/seed/g2a/1200/800'],
 231, 41, 20, true),

('피그마 대시보드 디자인',
 '관리자 UX 개선',
 '데이터 가시성을 중심으로 설계한 관리자 페이지.',
 '실습 프로젝트',
 '피그마-대시보드-디자인',
 'https://picsum.photos/seed/g3/600/400',
 ARRAY['https://picsum.photos/seed/g3a/1200/800'],
 321, 55, 31, true),

-- ================================
-- REACT 프로젝트
-- ================================
('리액트 포트폴리오 사이트',
 'SPA 구조 설계',
 'React Router 기반 개인 포트폴리오 제작.',
 '학생 프로젝트',
 '리액트-포트폴리오-사이트',
 'https://picsum.photos/seed/g4/600/400',
 ARRAY['https://picsum.photos/seed/g4a/1200/800'],
 420, 63, 44, true),

('리액트 관리자 페이지',
 '상태관리 + API 연동',
 'CRUD 및 대시보드 기능 구현.',
 'React 실습',
 '리액트-관리자-페이지',
 'https://picsum.photos/seed/g5/600/400',
 ARRAY['https://picsum.photos/seed/g5a/1200/800'],
 280, 38, 21, true),

-- ================================
-- HTML/CSS
-- ================================
('반응형 기업 사이트',
 'HTML CSS 레이아웃',
 'Grid와 Flex 기반 반응형 구현.',
 '프론트 기초',
 '반응형-기업-사이트',
 'https://picsum.photos/seed/g6/600/400',
 ARRAY['https://picsum.photos/seed/g6a/1200/800'],
 198, 14, 9, true),

('CSS 애니메이션 실습',
 'hover 인터랙션 구현',
 '마이크로 인터랙션 중심 UI.',
 'CSS 심화',
 'css-애니메이션-실습',
 'https://picsum.photos/seed/g7/600/400',
 ARRAY['https://picsum.photos/seed/g7a/1200/800'],
 154, 19, 7, true),

-- ================================
-- UX/UI
-- ================================
('UX 리서치 기반 앱 설계',
 '사용자 여정 맵 작성',
 '인터뷰 기반 문제 정의 → 해결 프로세스.',
 'UX 프로젝트',
 'ux-리서치-앱-설계',
 'https://picsum.photos/seed/g8/600/400',
 ARRAY['https://picsum.photos/seed/g8a/1200/800'],
 367, 72, 35, true),

('UI 키트 제작',
 '디자인 시스템 구축',
 '컬러/타이포/컴포넌트 체계화.',
 'UI 설계',
 'ui-키트-제작',
 'https://picsum.photos/seed/g9/600/400',
 ARRAY['https://picsum.photos/seed/g9a/1200/800'],
 189, 29, 16, true),

-- ================================
-- 추가 페이지네이션용 더미
-- ================================
('프로젝트 10', '설명', '테스트용 데이터', '포트폴리오', '프로젝트-10', 'https://picsum.photos/seed/g10/600/400', ARRAY['https://picsum.photos/seed/g10a/1200/800'], 52, 3, 1, true),
('프로젝트 11', '설명', '테스트용 데이터', '포트폴리오', '프로젝트-11', 'https://picsum.photos/seed/g11/600/400', ARRAY['https://picsum.photos/seed/g11a/1200/800'], 64, 4, 2, true),
('프로젝트 12', '설명', '테스트용 데이터', '포트폴리오', '프로젝트-12', 'https://picsum.photos/seed/g12/600/400', ARRAY['https://picsum.photos/seed/g12a/1200/800'], 72, 8, 3, true),
('프로젝트 13', '설명', '테스트용 데이터', '포트폴리오', '프로젝트-13', 'https://picsum.photos/seed/g13/600/400', ARRAY['https://picsum.photos/seed/g13a/1200/800'], 41, 2, 0, true),
('프로젝트 14', '설명', '테스트용 데이터', '포트폴리오', '프로젝트-14', 'https://picsum.photos/seed/g14/600/400', ARRAY['https://picsum.photos/seed/g14a/1200/800'], 90, 11, 5, true),
('프로젝트 15', '설명', '테스트용 데이터', '포트폴리오', '프로젝트-15', 'https://picsum.photos/seed/g15/600/400', ARRAY['https://picsum.photos/seed/g15a/1200/800'], 33, 1, 0, true),
('프로젝트 16', '설명', '테스트용 데이터', '포트폴리오', '프로젝트-16', 'https://picsum.photos/seed/g16/600/400', ARRAY['https://picsum.photos/seed/g16a/1200/800'], 21, 0, 0, true),
('프로젝트 17', '설명', '테스트용 데이터', '포트폴리오', '프로젝트-17', 'https://picsum.photos/seed/g17/600/400', ARRAY['https://picsum.photos/seed/g17a/1200/800'], 88, 6, 2, true),
('프로젝트 18', '설명', '테스트용 데이터', '포트폴리오', '프로젝트-18', 'https://picsum.photos/seed/g18/600/400', ARRAY['https://picsum.photos/seed/g18a/1200/800'], 111, 15, 6, true),
('프로젝트 19', '설명', '테스트용 데이터', '포트폴리오', '프로젝트-19', 'https://picsum.photos/seed/g19/600/400', ARRAY['https://picsum.photos/seed/g19a/1200/800'], 134, 17, 9, true),
('프로젝트 20', '설명', '테스트용 데이터', '포트폴리오', '프로젝트-20', 'https://picsum.photos/seed/g20/600/400', ARRAY['https://picsum.photos/seed/g20a/1200/800'], 56, 5, 3, true);



--갤러리 태그
INSERT INTO tags (name, slug)
VALUES
-- 디자인 툴
('피그마', '피그마'),
('포토샵', '포토샵'),
('일러스트레이터', '일러스트레이터'),
('애프터이펙트', '애프터이펙트'),

-- 개발
('html', 'html'),
('css', 'css'),
('자바스크립트', '자바스크립트'),
('타입스크립트', '타입스크립트'),
('리액트', '리액트'),
('넥스트js', '넥스트js'),

-- UI/UX
('ux', 'ux'),
('ui', 'ui'),
('와이어프레임', '와이어프레임'),
('프로토타입', '프로토타입'),
('디자인시스템', '디자인시스템'),

-- 프로젝트 성격
('랜딩페이지', '랜딩페이지'),
('대시보드', '대시보드'),
('모바일앱', '모바일앱'),
('웹앱', '웹앱'),
('이커머스', '이커머스'),

-- 스타일
('미니멀', '미니멀'),
('다크모드', '다크모드'),
('모던', '모던'),
('브루탈리즘', '브루탈리즘'),
('글래스모피즘', '글래스모피즘'),

-- 목적
('포트폴리오', '포트폴리오'),
('클라이언트작업', '클라이언트작업'),
('개인프로젝트', '개인프로젝트'),
('스터디프로젝트', '스터디프로젝트');

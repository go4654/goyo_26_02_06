INSERT INTO classes (
  id,
  title,
  description,
  category,
  slug,
  thumbnail_image_url,
  cover_image_urls,
  content_mdx,
  author_id,
  is_published,
  is_deleted,
  view_count,
  like_count,
  save_count,
  comment_count,
  published_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  title,
  description,
  category,
  slug,
  'https://picsum.photos/seed/' || slug || '/600/400',
  ARRAY[
    'https://picsum.photos/seed/' || slug || 'a/1200/600',
    'https://picsum.photos/seed/' || slug || 'b/1200/600'
  ],
  '## ' || title || E'\n\n이 클래스는 **' || category || '** 실전 학습 콘텐츠입니다.\n\n### 학습 내용\n- 핵심 개념 정리\n- 실습 예제\n- 프로젝트 적용\n',
  (SELECT profile_id FROM profiles WHERE role = 'admin' LIMIT 1),
  true,
  false,
  floor(random() * 8000)::int,
  floor(random() * 500)::int,
  floor(random() * 300)::int,
  floor(random() * 100)::int,
  now(),
  now(),
  now()
FROM (
  VALUES
  -- Photo shop
  ('포토샵 레이어 기초', '레이어 구조 이해', 'Photo shop', '포토샵-레이어-기초'),
  ('포토샵 합성 실전', '실무 합성 테크닉', 'Photo shop', '포토샵-합성-실전'),
  ('포토샵 색보정 마스터', '컬러 보정 심화', 'Photo shop', '포토샵-색보정-마스터'),
  ('포토샵 브러시 활용', '브러시 테크닉', 'Photo shop', '포토샵-브러시-활용'),

  -- Illustrator
  ('일러스트 벡터 원리', '벡터 이해', 'Illustrator', '일러스트-벡터-원리'),
  ('일러스트 로고 제작', '로고 실습', 'Illustrator', '일러스트-로고-제작'),
  ('패턴 디자인 실습', '패턴 제작', 'Illustrator', '일러스트-패턴-디자인'),
  ('아이콘 디자인 가이드', '아이콘 설계', 'Illustrator', '일러스트-아이콘-디자인'),

  -- Figma
  ('피그마 컴포넌트 구조', '디자인 시스템', 'Figma', '피그마-컴포넌트-구조'),
  ('오토레이아웃 마스터', '반응형 설계', 'Figma', '피그마-오토레이아웃'),
  ('피그마 프로토타이핑', '인터랙션 설계', 'Figma', '피그마-프로토타입'),
  ('디자인 토큰 관리', '디자인 토큰', 'Figma', '피그마-디자인-토큰'),

  -- UX UI
  ('UX 리서치 기초', '사용자 조사', 'UX UI', 'ux-리서치-기초'),
  ('UI 디자인 패턴', '패턴 설계', 'UX UI', 'ui-디자인-패턴'),
  ('사용자 여정 맵', '저니맵 작성', 'UX UI', 'ux-사용자-여정맵'),
  ('와이어프레임 설계', '초기 설계', 'UX UI', 'ui-와이어프레임'),

  -- Html
  ('HTML 시맨틱 구조', '마크업 기초', 'Html', 'html-시맨틱-구조'),
  ('폼 UX 설계', '입력폼 최적화', 'Html', 'html-폼-ux-설계'),
  ('접근성 마크업', '웹 접근성', 'Html', 'html-접근성'),
  ('SEO 마크업 전략', '검색 최적화', 'Html', 'html-seo-전략'),

  -- Css
  ('CSS Flex 기초', 'Flexbox 이해', 'Css', 'css-flex-기초'),
  ('CSS Grid 심화', 'Grid 실습', 'Css', 'css-grid-심화'),
  ('애니메이션 효과', 'CSS Motion', 'Css', 'css-애니메이션'),
  ('반응형 레이아웃', 'Media Query', 'Css', 'css-반응형'),

  -- Javascript
  ('자바스크립트 기초 문법', 'JS 기본기', 'Javascript', '자바스크립트-기초'),
  ('클로저 심화', '고급 함수', 'Javascript', '자바스크립트-클로저'),
  ('비동기 처리 패턴', 'Async 흐름', 'Javascript', '자바스크립트-비동기'),
  ('이벤트 루프 이해', '동작 원리', 'Javascript', '자바스크립트-이벤트루프'),

  -- jQuery
  ('jQuery DOM 제어', 'DOM 조작', 'jQuery', 'jquery-dom-제어'),
  ('이벤트 핸들링', '이벤트 처리', 'jQuery', 'jquery-이벤트'),
  ('AJAX 요청 처리', '비동기 통신', 'jQuery', 'jquery-ajax'),
  ('레거시 개선 전략', '현대화', 'jQuery', 'jquery-레거시-개선'),

  -- React
  ('React 상태 관리', 'useState 활용', 'React', 'react-상태관리'),
  ('컴포넌트 설계 패턴', '패턴 정리', 'React', 'react-설계패턴'),
  ('React 성능 최적화', '최적화 전략', 'React', 'react-성능최적화'),
  ('React Router 구조', '라우팅 설계', 'React', 'react-라우터'),

  -- Git
  ('Git 브랜치 전략', '협업 전략', 'Git', 'git-브랜치-전략'),
  ('Git 충돌 해결', 'merge vs rebase', 'Git', 'git-충돌해결'),
  ('Commit 메시지 규칙', '작성 가이드', 'Git', 'git-커밋-규칙'),
  ('Git Flow 실전', '운영 전략', 'Git', 'git-flow'),

  -- Typescript
  ('타입스크립트 기본기', '타입 이해', 'Typescript', '타입스크립트-기본기'),
  ('제네릭 실전', '고급 타입', 'Typescript', '타입스크립트-제네릭'),
  ('유틸리티 타입', '실무 활용', 'Typescript', '타입스크립트-유틸리티'),
  ('타입 안전 설계', '안전한 코드', 'Typescript', '타입스크립트-설계')

) AS seed(title, description, category, slug);



----------------
INSERT INTO classes (
  id,
  title,
  description,
  category,
  slug,
  thumbnail_image_url,
  cover_image_urls,
  content_mdx,
  author_id,
  is_published,
  is_deleted,
  view_count,
  like_count,
  save_count,
  comment_count,
  published_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  title,
  description,
  'figma',
  slug,
  'https://picsum.photos/seed/' || slug || '/600/400',
  ARRAY[
    'https://picsum.photos/seed/' || slug || 'a/1200/600',
    'https://picsum.photos/seed/' || slug || 'b/1200/600'
  ],
  '## ' || title || E'\n\n이 강의는 **Figma 실전 활용 과정**입니다.\n\n### 학습 내용\n- 실무 예제\n- 디자인 시스템 구성\n- 협업 워크플로우\n',
  (SELECT profile_id FROM profiles WHERE role = 'admin' LIMIT 1),
  true,
  false,
  floor(random() * 9000)::int,
  floor(random() * 800)::int,
  floor(random() * 500)::int,
  floor(random() * 150)::int,
  now(),
  now(),
  now()
FROM (
  VALUES
  ('피그마 디자인 시스템 구축', '실전 시스템 설계', '피그마-디자인시스템-구축'),
  ('피그마 반응형 UI 설계', '반응형 레이아웃', '피그마-반응형-ui'),
  ('피그마 협업 전략', '팀 협업 구조', '피그마-협업-전략'),
  ('피그마 라이브러리 관리', '라이브러리 구조', '피그마-라이브러리-관리'),
  ('피그마 토큰 설계', '토큰 구조', '피그마-토큰-설계'),
  ('피그마 컴포넌트 심화', '재사용 패턴', '피그마-컴포넌트-심화'),
  ('피그마 프로토타입 인터랙션', '인터랙션 설계', '피그마-프로토타입-인터랙션'),
  ('피그마 변수 활용', 'Variables 실습', '피그마-변수-활용'),
  ('피그마 디자인 QA', '검수 전략', '피그마-디자인-qa'),
  ('피그마 모바일 UI 제작', '모바일 최적화', '피그마-모바일-ui'),
  ('피그마 웹 UI 제작', '웹 설계', '피그마-웹-ui'),
  ('피그마 다크모드 설계', '다크 테마', '피그마-다크모드'),
  ('피그마 아이콘 시스템', '아이콘 설계', '피그마-아이콘-시스템'),
  ('피그마 플러그인 활용', '플러그인 실습', '피그마-플러그인'),
  ('피그마 UX 플로우 설계', '플로우 설계', '피그마-ux-플로우'),
  ('피그마 UI 키트 제작', 'UI 키트 만들기', '피그마-ui키트'),
  ('피그마 스페이싱 시스템', '간격 규칙', '피그마-스페이싱'),
  ('피그마 오토레이아웃 심화', 'Auto Layout 고급', '피그마-오토레이아웃-심화'),
  ('피그마 접근성 설계', 'Accessibility', '피그마-접근성'),
  ('피그마 브랜딩 시스템', '브랜드 시스템', '피그마-브랜딩'),
  ('피그마 카드 컴포넌트 설계', '카드 패턴', '피그마-카드-설계'),
  ('피그마 버튼 시스템', '버튼 설계', '피그마-버튼-시스템'),
  ('피그마 대시보드 설계', '대시보드 UI', '피그마-대시보드'),
  ('피그마 디자인 리뷰 프로세스', '리뷰 흐름', '피그마-디자인-리뷰'),
  ('피그마 협업 워크플로우', '운영 프로세스', '피그마-워크플로우')

) AS seed(title, description, slug);
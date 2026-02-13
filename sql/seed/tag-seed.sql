--태그 시드

INSERT INTO public.tags (name, slug)
VALUES
('레이어', '레이어'),
('마스크', '마스크'),
('보정', '보정'),
('합성', '합성'),
('리터칭', '리터칭'),
('브러시', '브러시'),
('컬러그레이딩', '컬러그레이딩'),

('벡터', '벡터'),
('패스파인더', '패스파인더'),
('아이콘', '아이콘'),
('로고디자인', '로고디자인'),
('타이포그래피', '타이포그래피'),
('그라디언트', '그라디언트'),

('오토레이아웃', '오토레이아웃'),
('컴포넌트', '컴포넌트'),
('프로토타입', '프로토타입'),
('디자인시스템', '디자인시스템'),
('UI키트', 'UI키트'),
('변형', '변형'),
('반응형', '반응형');




-- 전체 클래스에 랜덤 태그 붙이기 (테스트용 추천)
INSERT INTO public.class_tags (class_id, tag_id)
SELECT
  c.id,
  t.id
FROM public.classes c
JOIN LATERAL (
  SELECT id
  FROM public.tags
  ORDER BY random()
  LIMIT (1 + floor(random() * 3))::int  -- 클래스당 1~3개 랜덤 태그
) t ON true
ON CONFLICT DO NOTHING;

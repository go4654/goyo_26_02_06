INSERT INTO inquiries (
  id,
  profile_id,
  title,
  category,
  status,
  last_activity_at,
  created_at,
  updated_at
) VALUES
(
  gen_random_uuid(),
  '565a3b62-6a71-4d57-b456-c065bf5731d8',
  '강의 영상이 재생되지 않습니다',
  'class',
  'pending',
  now(),
  now() - interval '2 days',
  now()
),
(
  gen_random_uuid(),
  '62c7de10-0d43-4eb6-b79c-ddb27dd7d8db',
  '전자책 다운로드 오류',
  'class',
  'answered',
  now() - interval '1 day',
  now() - interval '3 days',
  now()
),
(
  gen_random_uuid(),
  '565a3b62-6a71-4d57-b456-c065bf5731d8',
  '계정 이메일 변경 요청',
  'account',
  'closed',
  now() - interval '5 days',
  now() - interval '7 days',
  now()
);




-- answered 문의에 대한 메시지
INSERT INTO inquiry_messages (
  id,
  inquiry_id,
  author_profile_id,
  author_role,
  content,
  created_at
)
SELECT
  gen_random_uuid(),
  i.id,
  '565a3b62-6a71-4d57-b456-c065bf5731d8',
  'user',
  '다운로드 버튼을 눌러도 아무 반응이 없습니다.',
  now() - interval '3 days'
FROM inquiries i
WHERE i.title = '전자책 다운로드 오류';

INSERT INTO inquiry_messages (
  id,
  inquiry_id,
  author_profile_id,
  author_role,
  content,
  created_at
)
SELECT
  gen_random_uuid(),
  i.id,
  '5e950821-578c-41a8-ab2e-3887525c8c56',
  'admin',
  '현재 서버 점검 중입니다. 10분 후 다시 시도해주세요.',
  now() - interval '1 day'
FROM inquiries i
WHERE i.title = '전자책 다운로드 오류';
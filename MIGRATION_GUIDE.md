# 마이그레이션 가이드

## 개요

이 문서는 관리자 기능 추가를 위한 데이터베이스 마이그레이션 가이드입니다.

## 문제와 해결 방법

### 문제: RLS 무한 재귀 오류

RLS(Row Level Security) 정책 내에서 같은 `profiles` 테이블을 조회하려고 하면 **무한 재귀(infinite recursion)** 오류가 발생합니다.

```sql
-- ❌ 잘못된 코드 (무한 재귀 발생)
CREATE POLICY "select-profile-policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = profile_id
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile  -- RLS 정책이 또 실행됨!
    WHERE admin_profile.profile_id = auth.uid()
    AND admin_profile.role = 'admin'
  )
);
```

### 해결: SECURITY DEFINER 헬퍼 함수 (보안 강화)

`SECURITY DEFINER` 권한을 가진 헬퍼 함수를 생성하여 RLS를 우회합니다.

**⚠️ 중요: 매개변수 없이 auth.uid()만 사용하여 보안 취약점 방지**

```sql
-- ✅ 올바르고 안전한 코드 (RLS 우회 + 보안 강화)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profile_id = auth.uid()  -- ⭐ 항상 현재 사용자만!
    AND role = 'admin'
  );
$$;

-- 이제 RLS 정책에서 함수 사용
CREATE POLICY "select-profile-policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = profile_id
  OR 
  public.is_admin()  -- 무한 재귀 없음 + 다른 사용자 조회 불가능!
);
```

**왜 `is_admin()`이 더 안전한가?**

```sql
-- ❌ 취약한 구현 (매개변수 사용)
CREATE FUNCTION get_user_role(user_id uuid) ...
-- 문제: 클라이언트에서 SELECT get_user_role('다른-유저-uuid'); 가능!

-- ✅ 안전한 구현 (매개변수 없음)
CREATE FUNCTION is_admin() ...
-- 안전: 항상 auth.uid()만 사용, 다른 사용자 조회 불가능!
```

## 마이그레이션 순서

### 1️⃣ 로컬 마이그레이션 실행

```bash
npm run db:migrate
```

이 명령은 `profiles` 테이블에 `role` 컬럼과 인덱스를 추가합니다.

### 2️⃣ Supabase SQL Editor에서 RLS 정책 적용

Supabase Dashboard → SQL Editor → New Query

**파일**: `sql/fix-rls-recursion.sql`

이 스크립트는:
- ✅ 기존의 잘못된 RLS 정책 삭제
- ✅ `is_admin()` 헬퍼 함수 생성 (보안 강화)
- ✅ 올바른 RLS 정책 재생성
- ✅ 정책 확인

### 3️⃣ 관리자 권한 부여

Supabase SQL Editor에서 실행 (이메일을 본인 것으로 변경):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE profile_id = (
  SELECT id FROM auth.users
  WHERE email = 'your-email@example.com'
);
```

### 4️⃣ 권한 확인

```sql
SELECT 
  p.profile_id,
  p.name,
  p.role,
  u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.profile_id;

-- 현재 사용자가 관리자인지 확인
SELECT public.is_admin();
```

## 왜 Drizzle로 직접 마이그레이션하지 않나요?

Drizzle은 복잡한 PostgreSQL 함수 정의(`$$` 구문)를 파싱하지 못합니다. 따라서:

1. **간단한 스키마 변경** → Drizzle 마이그레이션 사용
2. **복잡한 함수/정책** → Supabase SQL Editor에서 직접 실행

## 파일 구조

```
sql/
├── migrations/
│   ├── 0002_add_role_and_admin_support.sql  # Drizzle용 간소화 버전
│   └── meta/
│       └── _journal.json                    # 마이그레이션 메타데이터
├── fix-rls-recursion.sql                    # Supabase에서 직접 실행
├── verify-migration.sql                     # 마이그레이션 확인
└── test-admin-setup.sql                     # 관리자 설정 테스트
```

## 테스트

### 관리자 계정으로 테스트

1. `/user/profile` 접근 → ✅ 성공
2. `/admin` 접근 → ✅ 성공 (관리자 대시보드 표시)

### 일반 사용자 계정으로 테스트

1. `/user/profile` 접근 → ✅ 성공
2. `/admin` 접근 → ❌ 403 Forbidden

## 문제 해결

### RLS 무한 재귀 오류가 계속 발생하는 경우

1. Supabase SQL Editor에서 기존 정책 확인:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'profiles';
```

2. 문제가 있는 정책 삭제:

```sql
DROP POLICY IF EXISTS "select-profile-policy" ON public.profiles;
DROP POLICY IF EXISTS "edit-profile-policy" ON public.profiles;
DROP POLICY IF EXISTS "delete-profile-policy" ON public.profiles;
```

3. `sql/fix-rls-recursion.sql` 다시 실행

### 관리자 권한이 작동하지 않는 경우

1. `get_user_role()` 함수가 생성되었는지 확인:

```sql
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'get_user_role';
```

2. 본인의 role 확인:

```sql
SELECT 
  p.profile_id,
  p.role,
  u.email,
  public.get_user_role(p.profile_id) as role_from_function
FROM public.profiles p
JOIN auth.users u ON u.id = p.profile_id
WHERE u.email = 'your-email@example.com';
```

3. role이 'admin'이 아니면 다시 업데이트

## 보안 고려사항

### SECURITY DEFINER의 위험성

`SECURITY DEFINER` 함수는 함수 소유자의 권한으로 실행되므로 신중하게 사용해야 합니다.

**안전한 사용법**:
1. ✅ `SET search_path = ''` 사용 (스키마 주입 방지)
2. ✅ 최소한의 기능만 구현
3. ✅ 입력 검증 (필요한 경우)
4. ✅ 읽기 전용 작업만 수행 (가능한 경우)

### RLS 정책 검증

정책이 올바르게 작동하는지 확인:

```sql
-- 자신의 프로필 조회 (성공해야 함)
SELECT * FROM public.profiles WHERE profile_id = auth.uid();

-- 다른 사용자 프로필 조회 (관리자만 성공)
SELECT * FROM public.profiles WHERE profile_id != auth.uid();

-- 헬퍼 함수 보안 테스트
SELECT public.is_admin();  -- ✅ 안전: 현재 사용자만 체크
```

### 보안 테스트

```sql
-- ✅ 안전: is_admin()은 매개변수가 없음
SELECT public.is_admin();

-- ❌ 이전 취약점: get_user_role()은 매개변수를 받아서 위험했음
-- SELECT public.get_user_role('다른-유저-uuid');  -- 다른 사용자 조회 가능했음!
```

## 관련 문서

- [ADMIN_SETUP.md](./ADMIN_SETUP.md) - 관리자 기능 설정 가이드
- [SECURITY_REVIEW.md](./SECURITY_REVIEW.md) - 보안 검토 보고서

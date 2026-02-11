# 보안 패치: RLS 헬퍼 함수 보안 강화

## 🚨 발견된 보안 취약점

### 문제: 다른 사용자 role 조회 가능

이전 구현에서 `get_user_role(user_id uuid)` 함수는 **매개변수를 받아서** 모든 사용자의 role을 조회할 수 있었습니다.

```sql
-- ❌ 취약한 구현
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE profile_id = user_id;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;
```

### 악용 시나리오

```sql
-- 클라이언트 측에서 실행 가능!
SELECT public.get_user_role('다른-유저-uuid-1');  -- 'admin' 반환
SELECT public.get_user_role('다른-유저-uuid-2');  -- 'user' 반환
SELECT public.get_user_role('다른-유저-uuid-3');  -- 'user' 반환

-- 결과: 모든 사용자의 role 정보 유출!
```

**영향도**:
- 🔴 **심각도: 높음** - 정보 유출 (Information Disclosure)
- 🔴 클라이언트에서 모든 사용자의 권한 레벨 조회 가능
- 🔴 관리자 계정 식별 가능
- 🟡 직접적인 권한 상승은 아니지만, 공격 표면 확대

## ✅ 보안 패치 적용

### 해결 방법: 매개변수 제거

`is_admin()` 함수는 **매개변수 없이** `auth.uid()`만 사용하여 현재 로그인한 사용자만 체크합니다.

```sql
-- ✅ 안전한 구현
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
```

### 차단된 공격 시나리오

```sql
-- 클라이언트에서 실행해도 안전!
SELECT public.is_admin();  -- ✅ 자신의 권한만 체크, true/false 반환

-- 다른 사용자 조회 불가능!
-- SELECT public.is_admin('다른-유저-uuid');  -- ❌ 컴파일 에러: 매개변수 없음
```

**보안 강화 효과**:
- ✅ **정보 유출 차단** - 다른 사용자 role 조회 불가능
- ✅ **최소 권한 원칙** - 자신의 정보만 조회 가능
- ✅ **boolean 반환** - role 값 자체를 노출하지 않음
- ✅ **공격 표면 축소** - 매개변수 없음 = 입력 검증 불필요

## 📋 변경 사항 요약

### 1. 함수 시그니처 변경

| 항목 | 이전 (취약) | 이후 (안전) |
|------|------------|------------|
| 함수명 | `get_user_role(user_id uuid)` | `is_admin()` |
| 매개변수 | ❌ `user_id uuid` | ✅ 없음 |
| 반환 타입 | ❌ `text` (role 값 노출) | ✅ `boolean` |
| 조회 대상 | ❌ 임의의 user_id | ✅ auth.uid() 고정 |

### 2. RLS 정책 업데이트

```sql
-- 이전 (취약)
USING (
  auth.uid() = profile_id
  OR public.get_user_role(auth.uid()) = 'admin'
);

-- 이후 (안전)
USING (
  auth.uid() = profile_id
  OR public.is_admin()
);
```

**개선 효과**:
- ✅ 더 읽기 쉬움
- ✅ 더 안전함
- ✅ 더 간결함

### 3. WITH CHECK 절 개선

```sql
-- 이전 (순환 참조 위험)
WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin'
  OR
  (auth.uid() = profile_id AND role = public.get_user_role(auth.uid()))
);

-- 이후 (안전)
WITH CHECK (
  public.is_admin()
  OR
  (
    auth.uid() = profile_id 
    AND role = (SELECT role FROM public.profiles WHERE profile_id = auth.uid())
  )
);
```

## 🔍 보안 테스트

### 테스트 1: 정상 동작 확인

```sql
-- 관리자 계정으로 로그인 후
SELECT public.is_admin();
-- 예상 결과: true

-- 일반 사용자 계정으로 로그인 후
SELECT public.is_admin();
-- 예상 결과: false
```

### 테스트 2: 다른 사용자 조회 불가능 확인

```sql
-- ❌ 컴파일 에러: 함수 인자가 없음
-- SELECT public.is_admin('other-user-uuid');
-- ERROR: function public.is_admin(uuid) does not exist
```

### 테스트 3: RLS 정책 동작 확인

```sql
-- 일반 사용자로 로그인
SELECT * FROM public.profiles;
-- 예상 결과: 자신의 프로필만 조회됨

-- 관리자로 로그인
SELECT * FROM public.profiles;
-- 예상 결과: 모든 프로필 조회됨
```

## 📝 적용 방법

### 1단계: Supabase SQL Editor에서 실행

```bash
sql/fix-rls-recursion.sql
```

이 스크립트는:
1. 기존 취약한 정책 삭제
2. 안전한 `is_admin()` 함수 생성
3. 새로운 RLS 정책 적용

### 2단계: 확인

```sql
-- 함수 확인
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proargtypes::regtype[] as argument_types
FROM pg_proc
WHERE proname = 'is_admin';

-- 예상 결과:
-- function_name: is_admin
-- is_security_definer: true
-- argument_types: {}  (매개변수 없음!)
```

### 3단계: 보안 테스트

```sql
-- 현재 사용자가 관리자인지 확인
SELECT public.is_admin();

-- 다른 사용자 조회 시도 (실패해야 함)
-- SELECT public.is_admin('uuid');  -- 컴파일 에러
```

## 🛡️ 추가 보안 권장사항

### 1. 추가 role이 필요한 경우

```sql
-- editor, moderator 등 다른 role도 동일한 패턴 사용
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profile_id = auth.uid()  -- ⭐ auth.uid() 고정
    AND role = required_role
  );
$$;

-- 사용 예시
SELECT public.has_role('editor');
SELECT public.has_role('moderator');
```

### 2. 현재 사용자 role 조회 (필요한 경우)

```sql
-- 자신의 role만 반환
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role, 'user')
  FROM public.profiles
  WHERE profile_id = auth.uid();  -- ⭐ auth.uid() 고정
$$;

-- 클라이언트에서 안전하게 사용 가능
SELECT public.current_user_role();
```

### 3. REVOKE 추가 (선택사항)

```sql
-- public 실행 권한 제거
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
```

## 📚 참고 자료

### SECURITY DEFINER 함수 모범 사례

1. ✅ **SET search_path** 명시 - 스키마 주입 공격 방지
2. ✅ **매개변수 최소화** - 가능하면 auth.uid() 사용
3. ✅ **최소 권한 반환** - boolean > enum > text
4. ✅ **입력 검증** - 매개변수가 있다면 철저히 검증
5. ✅ **감사 로그** - 민감한 작업은 로그 기록

### PostgreSQL RLS 보안 가이드

- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [SECURITY DEFINER Functions](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ 체크리스트

패치 적용 후 확인:

- [x] `is_admin()` 함수 생성 확인
- [x] 매개변수 없음 확인
- [x] RLS 정책 업데이트 확인
- [x] 다른 사용자 조회 차단 확인
- [x] 관리자 권한 정상 동작 확인
- [x] 일반 사용자 제한 확인
- [x] 문서 업데이트 완료

## 🎯 결론

**보안 패치 완료**:
- ✅ 정보 유출 취약점 해결
- ✅ 최소 권한 원칙 적용
- ✅ 공격 표면 축소
- ✅ RLS 정책 간소화

**권장 사항**:
- 모든 `SECURITY DEFINER` 함수는 `auth.uid()` 기반으로 설계
- 매개변수로 user_id를 받지 않음
- boolean 반환으로 정보 노출 최소화

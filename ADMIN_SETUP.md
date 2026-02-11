# 관리자 기능 설정 가이드

## 개요

이 프로젝트는 일반 사용자와 관리자를 구분하는 역할 기반 접근 제어(RBAC)를 구현합니다.

---

## 1. 마이그레이션 실행

```bash
npm run db:migrate
```

마이그레이션이 실패하면 Supabase SQL Editor에서 수동 실행:
```sql
-- sql/migrations/0002_add_role_and_admin_support.sql 파일 내용 복사하여 실행
```

---

## 2. 관리자 계정 생성

### Supabase SQL Editor에서 실행

```sql
-- 이메일로 찾아서 관리자로 변경
UPDATE public.profiles
SET role = 'admin'
WHERE profile_id = (
  SELECT id FROM auth.users
  WHERE email = 'your-email@example.com'
);

-- 변경 확인
SELECT 
  p.profile_id,
  p.name,
  p.role,
  u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.profile_id
WHERE p.role = 'admin';
```

---

## 3. 보안 설계

### 권한 체계

| 역할 | /user/profile | /admin | 다른 사용자 프로필 조회 | role 변경 |
|------|---------------|--------|----------------------|----------|
| 일반 사용자 (user) | ✅ | ❌ | ❌ | ❌ |
| 관리자 (admin) | ✅ | ✅ | ✅ | ✅ (관리자만) |

### 보안 계층

1. **Routes 레벨**: `/admin`은 `private.layout.tsx`로 보호
2. **Loader 레벨**: `admin.layout.tsx`의 `requireAdmin()` 호출
3. **DB 레벨**: RLS 정책으로 데이터 접근 제어
4. **API 레벨**: 관리자 API 엔드포인트에 `requireAdmin()` 적용

---

## 4. RLS 정책

### SELECT (조회)
- **일반 사용자**: 자신의 프로필만 조회 가능
- **관리자**: 모든 프로필 조회 가능

### UPDATE (수정)
- **일반 사용자**: 자신의 프로필 수정 가능 (단, `role` 변경 불가)
- **관리자**: 모든 프로필 수정 가능 (role 포함)

### DELETE (삭제)
- **일반 사용자**: 자신의 프로필 삭제 가능
- **관리자**: 모든 프로필 삭제 가능

---

## 5. 접근 흐름

### 일반 사용자가 /admin 접근 시도

```
1. /admin 접근
   ↓
2. private.layout.tsx: 로그인 확인 ✅
   ↓
3. admin.layout.tsx: requireAdmin() 호출
   ↓
4. DB에서 role 조회
   ↓
5. role = 'user' → 403 Forbidden 반환
   ↓
6. 접근 차단
```

### 관리자가 /admin 접근 시도

```
1. /admin 접근
   ↓
2. private.layout.tsx: 로그인 확인 ✅
   ↓
3. admin.layout.tsx: requireAdmin() 호출
   ↓
4. DB에서 role 조회
   ↓
5. role = 'admin' → user 객체 반환 ✅
   ↓
6. 관리자 대시보드 표시
```

---

## 6. 성능 최적화

### 중복 호출 방지
- `requireAdmin()`이 user 객체를 반환하므로 중복 `getUser()` 호출 제거
- 한 요청당 `getUser()` 1회만 호출

### 인덱스 추가
```sql
CREATE INDEX idx_profiles_role ON public.profiles(role);
```

---

## 7. 테스트

### 일반 사용자 테스트
1. 일반 계정으로 로그인
2. `/user/profile` 접근 → ✅ 성공
3. `/admin` 접근 → ❌ 403 Forbidden

### 관리자 테스트
1. 관리자 계정으로 로그인
2. `/user/profile` 접근 → ✅ 성공
3. `/admin` 접근 → ✅ 성공
4. 다른 사용자 프로필 조회 → ✅ 성공 (SQL Editor에서)

---

## 8. 트러블슈팅

### `/admin` 접근 시 403 에러

1. **프로필 확인**
   ```sql
   SELECT profile_id, role FROM public.profiles
   WHERE profile_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
   ```

2. **role 값 확인**
   - 정확히 `'admin'`이어야 함 (소문자)
   - 공백이나 다른 문자 없어야 함

3. **RLS 정책 확인**
   ```sql
   SELECT policyname, qual FROM pg_policies WHERE tablename = 'profiles';
   ```

4. **서버 로그 확인**
   - `requireAdmin()`에서 출력하는 에러 로그 확인
   - 브라우저 개발자 도구 네트워크 탭 확인

### 마이그레이션 실패

Supabase SQL Editor에서 수동 실행:
1. `sql/migrations/0002_add_role_and_admin_support.sql` 파일 열기
2. 전체 내용 복사
3. Supabase Dashboard → SQL Editor → 새 쿼리 → 붙여넣기 → 실행

---

## 9. 주의사항

⚠️ **보안**
- 관리자 role은 데이터베이스에서만 변경 가능
- 클라이언트에서 role 변경 시도 시 RLS 정책에 의해 차단됨

⚠️ **성능**
- role 인덱스가 추가되어 있어 조회 성능 최적화됨
- 중복 API 호출 제거로 비용 절감

⚠️ **비용**
- 일반적인 트래픽에서는 비용 차이 무시 가능
- 매우 높은 트래픽 시에만 캐싱 고려

---

## 10. 다음 단계

현재 구현:
- ✅ 로그인 사용자: /user/profile 접근 가능
- ✅ 관리자: Supabase에서 설정 가능
- ✅ 관리자: /admin 접근 가능
- ✅ 일반 사용자: 관리자 페이지 접근 차단
- ✅ DB 레벨 보안 (RLS)
- ✅ 성능 최적화 (중복 호출 제거)

추가 개발 가능:
- [ ] 관리자 UI에서 사용자 role 변경 기능
- [ ] 관리자 활동 로그
- [ ] 여러 관리자 레벨 (super-admin, moderator 등)
- [ ] 2FA (Two-Factor Authentication)

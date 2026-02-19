# 프로필 페이지 RPC 통합 설계

## 1. 현재 구조 및 성능 관점 분석

### 1.1 사용 중인 RPC (실제 호출 기준)

| RPC | 인자 | 용도 | 반환 형태 |
|-----|------|------|-----------|
| `get_profile_stats` | 없음 (auth.uid()) | 저장 수, 이번 주 학습 수 | 1 row TABLE |
| `get_profile_learning_summary` | user_uuid | 카테고리·최근 학습일·최근 주제·저장 수 | 1 row TABLE |
| `get_profile_weekly_learning` | user_uuid | 최근 7일 일별 조회 수 | 7 rows TABLE |
| `get_profile_recent_views` | user_uuid | 최근 조회 클래스/갤러리 10건 | 10 rows TABLE |

※ `get_profile_saved_classes` / `get_profile_saved_galleries` 는 현재 프로필 로더에서 호출되지 않으며, 저장 목록은 임시 데이터 사용 중.

### 1.2 성능 관점 문제 여부

- **네트워크·연결 비용**
  - 프로필 진입 시 **4회** HTTP 요청(각각 RPC 1회) 발생.
  - Supabase 무료 플랜: 동시 연결·요청 제한 있음. 요청 수가 많을수록 지연·실패 가능성 증가.
  - **결론**: 호출 횟수 감소(통합 1회) 시 네트워크 왕복·연결 재사용 측면에서 유리.

- **DB 부하**
  - 각 RPC는 **user_id 조건**으로만 스캔하며, 모두 인덱스 활용 가능.
  - 4개 쿼리가 순차 실행되므로, DB 입장에서는 “한 번에 한 유저” 단위로 처리됨.
  - **결론**: 현재도 큰 문제는 아니나, 통합 시 **한 번의 DB round-trip**으로 줄일 수 있어 지연 시간 감소 기대.

- **캐싱**
  - 개별 RPC 4개는 각각 따로 캐시 키를 가져야 함.
  - 통합 1개면 **한 키**로 프로필 전체를 캐시하기 쉬움.

**종합**: 현재도 치명적이진 않지만, **통합 RPC 1회**로 묶는 것이 성능·일관성·유지보수 측면에서 권장됨.

---

## 2. 통합 RPC 설계

### 2.1 목표

- 프로필 진입 시 **RPC 1회**로 모든 프로필용 데이터 반환.
- 기존 인덱스 그대로 활용, **user_id 기반**만 사용.
- 반환은 **단일 JSON 객체**로 고정해 클라이언트 파싱 단순화.

### 2.2 반환 JSON 구조 (권장)

```json
{
  "stats": {
    "saved_class_count": 0,
    "saved_gallery_count": 0,
    "weekly_learning_count": 0
  },
  "learning_summary": {
    "most_explored_category": "design",
    "last_learning_date": "2025-02-19T10:00:00.000Z",
    "recent_topics": ["클래스 A", "클래스 B"],
    "total_saved_classes": 0,
    "total_saved_galleries": 0
  },
  "weekly_learning": [
    { "date": "2025-02-13", "view_count": 2 },
    { "date": "2025-02-14", "view_count": 0 }
  ],
  "recent_views": [
    {
      "id": "uuid",
      "title": "제목",
      "slug": "slug",
      "category": "design",
      "type": "class",
      "viewed_at": "2025-02-19T10:00:00.000Z"
    }
  ]
}
```

- **stats**: 기존 `get_profile_stats`와 동일 의미.
- **learning_summary**: 기존 `get_profile_learning_summary`와 동일.
- **weekly_learning**: 기존 `get_profile_weekly_learning` (7일, date + view_count).
- **recent_views**: 기존 `get_profile_recent_views` (최대 10건, id/title/slug/category/type/viewed_at).

추후 **저장 목록**을 RPC에서 채울 경우 예시:

```json
{
  "saved_classes": [],
  "saved_galleries": []
}
```

를 같은 루트 객체에 추가하면 됨.

### 2.3 보안

- 인자: `user_uuid uuid` (필수).
- 함수 내부에서 `user_uuid = auth.uid()` 검사 후, 불일치 시 빈/에러 처리.
- `SECURITY DEFINER` + `SET search_path = public` 유지.

---

## 3. 인덱스 활용 점검

### 3.1 현재 인덱스 (마이그레이션 기준)

| 테이블 | 인덱스 | 통합 RPC에서 활용 |
|--------|--------|-------------------|
| class_view_events | user_id_idx, created_at_idx | user_id 조건 + created_at 정렬/범위 |
| gallery_view_events | user_id_idx, created_at_idx | 동일 |
| class_saves | user_id_idx | user_id 조건 COUNT |
| gallery_saves | user_id_idx | user_id 조건 COUNT |
| classes | (id, category 등) | JOIN용 |
| galleries | (id, category 등) | JOIN용 |

모든 서브쿼리가 **user_id**로 필터하므로 기존 **user_id** 인덱스가 그대로 사용됨.

### 3.2 대량 데이터(10만 row 이상) 대비

- **제한**
  - `recent_views`: `ORDER BY viewed_at DESC LIMIT 10`.
  - `recent_topics`: 상위 5건만 `array_agg`.
  - `weekly_learning`: 7일 고정 + `generate_series` + LEFT JOIN.
  - **전체 스캔 없음**, 모두 user_id로 좁힌 뒤 상한/집계만 수행.

- **선택적 개선** (데이터가 매우 커질 때)
  - `(user_id, created_at)` 복합 인덱스 추가 시, “최근 N건”·“최근 7일” 쿼리가 더 효율적.
  - 예:  
    `CREATE INDEX ... ON class_view_events (user_id, created_at DESC);`  
    (갤러리/class_saves 등도 동일 패턴 적용 가능.)

**결론**: 현재 인덱스만으로도 10만 row 이상 환경에서 안전하게 동작 가능. 복합 인덱스는 선택 사항.

복합 인덱스 추가 예시 (선택):

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS class_view_events_user_created_idx
  ON public.class_view_events (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS gallery_view_events_user_created_idx
  ON public.gallery_view_events (user_id, created_at DESC);
```

---

## 4. Supabase 무료 플랜 고려

- **동시 연결·요청**: 호출 4회 → 1회로 줄이면 연결/요청 수 감소.
- **실행 시간**: 쿼리 4개를 한 번에 실행하므로, DB 측 실행 시간은 비슷하거나 약간 증가할 수 있으나, **네트워크·연결 비용 감소**가 더 큼.
- **응답 크기**: JSON 하나로 약 2~5KB 수준 예상. 무료 플랜에서 문제될 크기 아님.

---

## 5. 예상 성능 영향 (요약)

| 항목 | 개별 4회 호출 | 통합 1회 호출 |
|------|----------------|----------------|
| HTTP 요청 수 | 4 | 1 |
| DB round-trip | 4 | 1 |
| 클라이언트 처리 | 4번 파싱·매핑 | 1번 파싱·매핑 |
| 캐시 키 | 4개 | 1개 |
| 인덱스 활용 | 동일 | 동일 |
| 대량 데이터 안전성 | 안전 | 안전 (동일 쿼리 로직) |

**권장**: 통합 RPC 1개로 리팩토링하여 네트워크·연결 비용을 줄이고, 캐싱·타입·에러 처리 단순화.

---

## 6. 통합 RPC 구현 파일

- **경로**: `sql/functions/get_profile_page_data.sql`
- **호출 예**: `supabase.rpc('get_profile_page_data', { p_user_uuid: user.id })`
- **반환**: 단일 `jsonb` 객체. 클라이언트는 `data.stats`, `data.learning_summary`, `data.weekly_learning`, `data.recent_views` 로 분해해 기존 UI에 매핑하면 됨.

## 7. 마이그레이션 시 주의

- 기존 `get_profile_stats`, `get_profile_learning_summary`, `get_profile_weekly_learning`, `get_profile_recent_views`는 **통합 RPC 배포 후** 단계적으로 제거하거나, 하위 호환용으로 유지할지 결정.
- 클라이언트(profile loader)는 **한 번에** `get_profile_page_data(user_uuid)` 만 호출하도록 변경하고, 반환 JSON을 기존과 동일한 형태로 분해해 사용하면 됨.

- 작성일: 2026_03_02
- 최종 점검 완료일: 2026_03_02

# GOYO

웹디자인/프론트엔드 수업용 + 실서비스 플랫폼.  
수업 기록(Class)과 학생 포트폴리오 큐레이션(Gallery), 공지/아카이브(News), 관리자 CMS(Admin)를 제공하는 SSR 기반 웹앱입니다.

- 운영 환경 기준으로 보안(RLS/권한/쿠키/SSR)과 유지보수를 우선합니다.
- 한국(KR) 중심 사용을 전제로 Cloudflare 보안 설정을 적용했습니다.

---

## Tech Stack

**Frontend / App**

- React Router v7 (Framework Mode)
- TypeScript
- Tailwind CSS
- shadcn/ui
- SSR 기반 서버 loader/action 구조

**Backend**

- Supabase (Auth, RLS, Storage)
- PostgreSQL
- Drizzle ORM

**Infra / Ops**

- Vercel (배포)
- Cloudflare (보안/SSL/DNS)
- Sentry (프로덕션 에러 모니터링)
- Google Analytics GA4

---

## Features

### Class

- 수업 내용(개념/예제/코드) 관리 및 열람
- 로그인 필요
- 카테고리/검색/그리드 기반 목록 UI

### Gallery

- 학생 포트폴리오 큐레이션/열람
- 로그인 + `gallery_access` 권한 유저만 접근
- 좋아요 / 저장 인터랙션(프론트 애니메이션 포함)
- 상세 콘텐츠는 MDX 렌더링 기반

### News

- 로그인 안 하면 리스트만 열람 가능
- 로그인 후 상세 열람 가능

### Admin

- `/admin` 경로에서 관리자 전용 CMS 제공
- 관리자만 콘텐츠 등록/수정/삭제
- `requireAdmin` 기반 비인가 접근은 404 처리
- 운영 보안상 관리자 계정은 별도 구글 계정 + 패스키(2FA) 사용 권장

### Global Controls

- Root loader에서 `site_settings`, `user role`, `maintenanceMode` 제어
- notice banner: `notice_version` 변경 시 재노출

---

## Security & Access Control

### Auth & Session

- Supabase Auth 사용
- SSR loader/action에서 쿠키 기반 세션을 사용하여 권한 판별
- 비밀번호 재설정 플로우:
  - Supabase 기본 `redirect_to` 사용 제거
  - `/auth/confirm → verifyOtp → /auth/forgot-password/create` 구조로 통일
  - public layout 예외 처리 완료

### RLS

- DB에서 권한을 최종적으로 강제(RLS)
- 기본 원칙: **admin only write**
- `view_events` anon 정책 제거/제한
- Trigger function에 `SET search_path = public` 적용
- `SECURITY DEFINER` 최소화

### Cloudflare

- SSL/TLS: Full(Strict) 권장
- KR only 정책(국가 제한) 운영
- Bot 차단/보안 규칙 적용 (운영 정책에 맞게 최소 구성)

> 주의: Cloudflare/AdBlock/브라우저 확장 프로그램이 Sentry/GA 요청을 차단할 수 있습니다.  
> 테스트는 시크릿 모드/확장 비활성 환경에서 확인하세요.

---

## Observability

### Sentry

- **프로덕션 환경에서만 활성화**
- 세션 리플레이는 개인정보 보호 옵션 적용(mask/block)
- 로컬 개발 환경에서는 UI에 내부 에러를 노출하지 않고 콘솔에만 출력하는 것을 기본 정책으로 권장

### Google Analytics (GA4)

- gtag 기반 삽입
- SPA 라우트 이동 추적이 필요하면 라우트 변경 시 page_view 이벤트 추가 권장

---

## Project Structure (Suggested)

아래는 유지보수 편의 기준의 권장 구조입니다.

---

# 클래스 예시

## [여기에 메인 제목 입력]

[여기에 서론 및 개요 작성. 핵심 키워드는 **볼드**로 강조하세요.]

<br/>

## [섹션 타이틀 입력 (예: 주요 특징 Top3)]

<ThreeColumns>
  <ThreeColumns.Item title="# [항목 1]">
    [간결하고 명확한 요약 설명 입력]
  </ThreeColumns.Item>

<ThreeColumns.Item title="# [항목 2]">
[간결하고 명확한 요약 설명 입력]
</ThreeColumns.Item>

<ThreeColumns.Item title="# [항목 3]">
[간결하고 명확한 요약 설명 입력]
</ThreeColumns.Item>
</ThreeColumns>

<br/>

## 01. [상세 주제 1 입력]

![이미지 경로]

[상세 설명 입력. 줄바꿈이 필요할 땐 <br/> 사용.]
설명 내용 두 번째 줄입니다.

<br/>

## 02. [상세 주제 2 입력]

![이미지 경로]

[상세 설명 입력. 강조하고 싶은 단어는 **볼드**를 활용하세요.]

### [소제목이나 단계별 가이드 (예: 설정하기 🚀)]

#### **1. [1단계 설명]**

![이미지 경로]

#### **2. [2단계 설명]**

![이미지 경로]

<br/>

# GOYO.’s <span className="text-primary">Tip</span>

**[핵심 키워드]** [여기에 실무 꿀팁이나 주의사항을 작성하세요.]
내용을 입력하세요.

<br/>
<br/>

## [마무리 멘트나 결론 입력]

[마지막으로 유저에게 전하고 싶은 메시지를 작성하세요.]

# 갤러리 예시

<MDXGalleryGrid
title="포트폴리오 제목"
description="설명"
studentName="학생 이름"
imageUrl="이미지 경로"
responsiveImageUrl="반응형 이미지 경로"

>

<MDXGalleryGrid.Item title="01. 항목 제목">
항목 설명
</MDXGalleryGrid.Item>

<MDXGalleryGrid.Item title="02. 항목 제목">
항목 설명
</MDXGalleryGrid.Item>

</MDXGalleryGrid>

/**
 * 클라이언트 진입점
 * 
 * 이 파일은 애플리케이션의 클라이언트 사이드 부분의 진입점 역할을 합니다.
 * React 애플리케이션의 하이드레이션, 국제화 및 에러 모니터링과 같은 중요한 서비스의
 * 초기화를 처리하며 최적의 로딩 성능을 보장합니다.
 * 
 * 주요 기능:
 * - 클라이언트 사이드 에러 모니터링 및 세션 재생을 위한 Sentry 통합
 * - 언어 감지가 포함된 국제화(i18n) 설정
 * - 성능 최적화가 포함된 React 하이드레이션
 * - 다국어 지원 (영어, 스페인어, 한국어)
 */

import * as Sentry from "@sentry/react-router";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { HydratedRouter } from "react-router/dom";
import { getInitialNamespaces } from "remix-i18next/client";

// i18n 설정 및 언어 리소스 가져오기
import i18n from "./i18n";
import en from "./locales/en";
import es from "./locales/es";
import ko from "./locales/ko";

/**
 * 클라이언트 사이드 초기화를 위한 하이드레이션 함수
 * 
 * 이 비동기 함수는 완전한 클라이언트 사이드 초기화 프로세스를 처리합니다:
 * 1. 에러 모니터링을 위한 Sentry 초기화 (프로덕션만)
 * 2. 언어 감지가 포함된 국제화를 위한 i18next 설정
 * 3. 서버 렌더링된 HTML로 React 애플리케이션 하이드레이션
 * 
 * 이 함수는 최적의 성능을 위해 requestIdleCallback 또는 setTimeout을 사용하여 호출되며,
 * 중요한 사용자 상호작용이 차단되지 않도록 보장합니다.
 */
async function hydrate() {
  // 프로덕션 환경에서만 에러 모니터링을 위한 Sentry 초기화
  if (import.meta.env.VITE_SENTRY_DSN && !import.meta.env.DEV) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      // 에러에 대한 모든 재생 캡처
      replaysOnErrorSampleRate: 1.0,
      // 성능 모니터링을 위해 일반 세션의 10% 샘플링
      replaysSessionSampleRate: 0.1,
      integrations: [
        // 개인정보 보호가 포함된 세션 재생 설정
        Sentry.replayIntegration({
          maskAllText: true, // 개인정보 보호를 위해 모든 텍스트 입력 마스킹
          blockAllMedia: true, // 재생에서 미디어 콘텐츠 차단
        }),
      ],
    });
  }

  // 국제화를 위한 i18next 초기화
  await i18next
    .use(initReactI18next) // i18next를 React와 연결
    .use(LanguageDetector) // 언어 감지 기능 추가
    .init({
      ...i18n, // 기본 i18n 설정 확장
      ns: getInitialNamespaces(), // 서버 렌더링된 콘텐츠에서 네임스페이스 가져오기
      detection: {
        order: ["htmlTag"], // HTML lang 속성에서 언어 감지
        caches: [], // 언어 감지 캐싱 비활성화
      },
      // 지원되는 모든 언어에 대한 언어 리소스 설정
      resources: {
        en: {
          common: en, // 영어 번역
        },
        es: {
          common: es, // 스페인어 번역
        },
        ko: {
          common: ko, // 한국어 번역
        },
      },
    });

  // 성능 최적화와 함께 React 애플리케이션 하이드레이션
  startTransition(() => {
    // startTransition을 사용하여 이를 비긴급 업데이트로 표시
    // 이를 통해 React가 더 중요한 업데이트를 우선순위화할 수 있습니다
    hydrateRoot(
      document, // 전체 문서 하이드레이션
      <I18nextProvider i18n={i18next}>
        {/* 전체 애플리케이션에 i18n 컨텍스트 제공 */}
        <StrictMode>
          {/* 추가 개발 검사를 위해 React strict 모드 활성화 */}
          <HydratedRouter />
          {/* React Router의 HydratedRouter 사용 */}
        </StrictMode>
      </I18nextProvider>,
    );
  });
}

/**
 * 최적의 하이드레이션 스케줄링
 * 
 * 이 코드는 사용 가능한 가장 효율적인 방법을 사용하여 하이드레이션 프로세스를 스케줄링합니다:
 * - requestIdleCallback: 사용 가능한 경우 브라우저 유휴 시간 동안 하이드레이션을 실행하는 데 사용
 * - setTimeout: requestIdleCallback을 지원하지 않는 브라우저를 위한 폴백으로 사용
 * 
 * 이 접근 방식은 하이드레이션 프로세스가 중요한 사용자 상호작용을 차단하지 않도록 보장하며,
 * 특히 저사양 기기에서 최상의 사용자 경험을 제공합니다.
 */
if (window.requestIdleCallback) {
  // 최적의 성능을 위해 사용 가능한 경우 requestIdleCallback 사용
  // 브라우저 유휴 시간 동안 하이드레이션 프로세스가 실행됩니다
  window.requestIdleCallback(hydrate);
} else {
  // requestIdleCallback을 지원하지 않는 브라우저를 위한 폴백
  // 메인 스레드가 비어 있는 후 실행을 지연시키기 위해 최소 타임아웃 사용
  setTimeout(hydrate, 1);
}

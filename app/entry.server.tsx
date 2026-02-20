/**
 * 서버 진입점
 *
 * 이 파일은 애플리케이션의 서버 사이드 렌더링(SSR)을 처리합니다.
 * 국제화, 스트리밍 렌더링 및 에러 처리를 설정합니다.
 *
 * 서버 진입점은 다음을 담당합니다:
 * 1. 서버 사이드 렌더링을 위한 i18n 설정
 * 2. 최적의 성능을 위해 애플리케이션을 스트림으로 렌더링
 * 3. 프로덕션을 위한 보안 헤더 설정
 * 4. 에러 처리 및 Sentry로 에러 보고
 * 5. 봇 및 검색 엔진을 위한 렌더링 최적화
 * 6. 요청이 멈추는 것을 방지하기 위한 스트리밍 타임아웃 관리
 */
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import type {
  AppLoadContext,
  EntryContext,
  HandleErrorFunction,
} from "react-router";

import { createReadableStreamFromReadable } from "@react-router/node";
import * as Sentry from "@sentry/node";
import { createInstance } from "i18next";
import { isbot } from "isbot";
import { resolve as resolvePath } from "node:path";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { ServerRouter } from "react-router";

// i18n 설정 및 번역 리소스 가져오기
import i18next from "./core/lib/i18next.server";
// 서버 사이드 i18n 인스턴스
import i18n from "./i18n";
// 공유 i18n 설정
import en from "./locales/en";
// 영어 번역
import es from "./locales/es";
// 스페인어 번역
import ko from "./locales/ko";

// 한국어 번역

/**
 * 스트리밍 콘텐츠를 기다릴 최대 시간(밀리초)
 *
 * 이 타임아웃은 시간이 너무 오래 걸리면 스트림을 중단하여 요청이 멈추는 것을 방지합니다.
 * 5초 타임아웃은 데이터 로딩에 충분한 시간을 주면서 느린 연결의 사용자에게
 * 과도한 대기 시간을 방지하는 균형입니다.
 *
 * 이 타임아웃 후에는 스트림이 중단되고 현재 콘텐츠가 전송됩니다.
 */
export const streamTimeout = 5_000;

/**
 * 메인 서버 사이드 렌더링 핸들러
 *
 * 이 함수는 모든 서버 사이드 렌더링 요청의 진입점입니다.
 * i18n을 설정하고, 애플리케이션을 스트림으로 렌더링하며, 응답 헤더를 구성합니다.
 *
 * @param request - 들어오는 HTTP 요청
 * @param responseStatusCode - 응답에 사용할 HTTP 상태 코드
 * @param responseHeaders - 응답에 포함할 HTTP 헤더
 * @param routerContext - 라우트 정보를 포함하는 React Router 컨텍스트
 * @param loadContext - 애플리케이션을 위한 추가 컨텍스트 데이터
 * @returns Response 객체로 해결되는 Promise
 */
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
  // 미들웨어가 활성화된 경우:
  // loadContext: unstable_RouterContextProvider
) {
  return new Promise(async (resolve, reject) => {
    const i18nextInstance = createInstance();

    const lng = await i18next.getLocale(request);
    const ns = i18next.getRouteNamespaces(routerContext);

    await i18nextInstance.use(initReactI18next).init({
      ...i18n,
      lng,
      ns,
      resources: {
        en: {
          common: en,
        },
        es: {
          common: es,
        },
        ko: {
          common: ko,
        },
      },
    });

    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");

    /**
     * 사용자 에이전트를 기반으로 적절한 렌더링 전략 결정
     *
     * 검색 엔진과 봇의 경우, 응답을 보내기 전에 모든 콘텐츠가 로드되도록
     * 'onAllReady'를 사용합니다. 이는 완전한 콘텐츠를 제공하여 SEO를 개선합니다.
     *
     * 일반 사용자의 경우, 스트리밍으로 더 빠른 초기 페이지 로드를 위해
     * 'onShellReady'를 사용합니다.
     *
     * SPA 모드도 정적 생성을 위해 완전한 콘텐츠를 보장하기 위해 'onAllReady'를 사용합니다.
     *
     * @see https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
     */
    let readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady" // 봇 및 정적 생성을 위한 완전한 렌더링
        : "onShellReady"; // 일반 사용자를 위한 스트리밍 렌더링

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18nextInstance}>
        <ServerRouter context={routerContext} url={request.url} />
      </I18nextProvider>,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          responseHeaders.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload",
          );
          if (process.env.NODE_ENV === "production") {
            // 필요에 따라 프로덕션용 CSP를 확장하거나 재정의합니다
            // responseHeaders.set(
            //   "Content-Security-Policy",
            //   `
            //     default-src 'self';
            //     script-src 'self' https: 'unsafe-inline';
            //     style-src 'self' https: 'unsafe-inline';
            //     font-src 'self' https:;
            //     img-src 'self' https: data:;
            //     connect-src 'self' https:;
            //     frame-src 'self' https:;
            //     media-src 'self' https:;
            //     object-src 'none';
            //     base-uri 'self';
            //     frame-ancestors 'self';
            //   `
            //     .replace(/\s{2,}/g, " ")
            //     .trim(),
            // );
          }
          responseHeaders.set("X-Content-Type-Options", "nosniff");
          responseHeaders.set(
            "Referrer-Policy",
            "strict-origin-when-cross-origin",
          );
          responseHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
          responseHeaders.set("Cross-Origin-Embedder-Policy", "unsafe-none");
          responseHeaders.set("X-Frame-Options", "DENY");
          responseHeaders.set("X-XSS-Protection", "1; mode=block");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // 셸 내부의 스트리밍 렌더링 에러를 로깅합니다. 초기 셸 렌더링 중에
          // 발생한 에러는 로깅하지 않습니다. 이들은 거부되고
          // handleDocumentRequest에서 로깅됩니다.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    // 거부된 경계를 플러시할 시간을 주기 위해 `streamTimeout` 후에
    // 렌더링 스트림을 중단합니다
    setTimeout(abort, streamTimeout + 1000);
  });
}

/**
 * 전역 서버 사이드 에러 핸들러
 *
 * 이 함수는 프로덕션 환경에서 서버 사이드 에러를 포착하여 Sentry에 보고합니다.
 * 요청이 중단되지 않았고 Sentry가 구성된 경우에만 에러를 보고합니다.
 *
 * @param error - 렌더링 중 발생한 에러
 * @param context - 요청 및 기타 정보를 포함하는 컨텍스트 객체
 */
export const handleError: HandleErrorFunction = (error, { request }) => {
  if (
    !request.signal.aborted &&
    process.env.SENTRY_DSN &&
    process.env.NODE_ENV === "production"
  ) {
    // 모니터링 및 알림을 위해 Sentry에 에러 전송
    Sentry.captureException(error);
    // 서버 사이드 가시성을 위해 콘솔에도 로깅
    console.error(error);
  }
};

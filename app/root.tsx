/**
 * 루트 애플리케이션 컴포넌트
 *
 * 애플리케이션의 최상위 컴포넌트로 다음을 설정합니다:
 * - 다크/라이트 모드를 지원하는 테마 관리
 * - 국제화(i18n) 설정
 * - 다이얼로그 및 시트와 같은 전역 UI 컴포넌트
 * - 에러 바운더리 및 404 처리
 * - 분석 통합 (Google Tag Manager)
 * - 고객 지원 통합 (Channel.io)
 * - 네비게이션 진행 표시기
 */
import "./app.css";

import type { Route } from "./+types/root";

import * as Sentry from "@sentry/react-router";
import NProgress from "nprogress";
import nProgressStyles from "nprogress/nprogress.css?url";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
  useNavigate,
  useNavigation,
  useRouteLoaderData,
  useSearchParams,
} from "react-router";
import { useChangeLanguage } from "remix-i18next/react";
import {
  PreventFlashOnWrongTheme,
  ThemeProvider,
  useTheme,
} from "remix-themes";
import { Toaster } from "sonner";

import { Dialog } from "./core/components/ui/dialog";
import { Sheet } from "./core/components/ui/sheet";
import i18next from "./core/lib/i18next.server";
import { themeSessionResolver } from "./core/lib/theme-session.server";
import { cn } from "./core/lib/utils";
import NotFound from "./core/screens/404";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
  },
  { rel: "stylesheet", href: nProgressStyles },
];

/**
 * 루트 로더 함수
 *
 * 이 서버 사이드 함수는 모든 요청에서 실행되며 다음을 담당합니다:
 * 1. 필수 환경 변수가 모두 존재하는지 검증
 * 2. 세션에서 사용자의 테마 선호도 로드
 * 3. 사용자의 선호 로케일 감지
 *
 * 이 로더에서 반환된 데이터는 'root' ID를 가진 useRouteLoaderData 훅을 통해
 * 애플리케이션 전체에서 사용할 수 있습니다.
 *
 * @param request - 들어오는 HTTP 요청
 * @returns 테마 및 로케일 선호도를 포함하는 객체
 */
export async function loader({ request }: Route.LoaderArgs) {
  // 필수 Supabase 환경 변수가 모두 존재하는지 검증
  // 불완전한 설정으로 애플리케이션이 시작되는 것을 방지합니다
  if (
    !process.env.DATABASE_URL ||
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.DATABASE_URL === "" ||
    process.env.SUPABASE_URL === "" ||
    process.env.SUPABASE_ANON_KEY === "" ||
    process.env.SUPABASE_SERVICE_ROLE_KEY === ""
  ) {
    throw new Error("Missing Supabase environment variables");
  }

  // 성능 향상을 위해 테마와 로케일 선호도를 동시에 로드
  const [{ getTheme }, locale] = await Promise.all([
    themeSessionResolver(request),
    i18next.getLocale(request),
  ]);

  return {
    theme: getTheme(),
    locale,
  };
}

/**
 * 루트 라우트의 i18n 핸들
 * 이 라우트가 'common' 번역 네임스페이스를 사용함을 지정합니다
 */
export const handle = {
  i18n: "common",
};

/**
 * 기본 레이아웃 컴포넌트
 *
 * 이 컴포넌트는 다크/라이트 모드 기능을 활성화하기 위해 ThemeProvider로
 * 전체 애플리케이션을 감쌉니다. 루트 로더 데이터에서 테마 선호도를 가져오고
 * 테마 전환 API 엔드포인트를 제공합니다.
 *
 * @param children - 레이아웃 내에서 렌더링할 자식 컴포넌트
 */
export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData("root");
  return (
    <ThemeProvider
      specifiedTheme={data?.theme ?? "dark"} // 지정되지 않은 경우 다크 테마를 기본값으로 사용
      themeAction="/api/settings/theme" // 테마 변경을 위한 API 엔드포인트
    >
      <InnerLayout>{children}</InnerLayout>
    </ThemeProvider>
  );
}

/**
 * 내부 레이아웃 컴포넌트
 *
 * 이 컴포넌트는 애플리케이션의 HTML 구조를 처리하고 다음을 적용합니다:
 * - 현재 로케일을 기반으로 한 언어 방향 (RTL/LTR)
 * - HTML 요소에 테마 클래스 적용
 * - 사전 렌더링된 라우트(블로그, 법적 페이지)에 대한 특별 처리
 * - 분석 및 고객 지원 스크립트 로드
 *
 * @param children - 레이아웃 내에서 렌더링할 자식 컴포넌트
 */
function InnerLayout({ children }: { children: React.ReactNode }) {
  const [theme] = useTheme();
  const data = useRouteLoaderData<typeof loader>("root");
  const { i18n } = useTranslation();
  const { pathname } = useLocation();

  // 로더에서 가져온 로케일을 기반으로 i18next 언어 설정
  useChangeLanguage(data?.locale ?? "en");

  // 현재 라우트가 사전 렌더링된 페이지(블로그 또는 법적 페이지)인지 감지
  // 이러한 페이지는 특별한 테마 처리가 필요합니다
  const isPreRendered =
    pathname.includes("/legal") || pathname.includes("/blog");

  return (
    <html
      lang={data?.locale ?? "en"}
      className={cn(theme ?? "", "h-full")}
      dir={i18n.dir()}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {isPreRendered ? (
          <script src="/scripts/prerendered-theme.js" />
        ) : (
          <PreventFlashOnWrongTheme ssrTheme={Boolean(data?.theme)} />
        )}
      </head>
      <body className="h-full">
        {children}
        <Toaster richColors position="bottom-right" />
        <ScrollRestoration />
        <Scripts />
        {import.meta.env.VITE_GOOGLE_TAG_ID &&
          import.meta.env.VITE_GOOGLE_TAG_ID !== "" && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GOOGLE_TAG_ID}`}
              ></script>
              <script
                dangerouslySetInnerHTML={{
                  __html: `window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${import.meta.env.VITE_GOOGLE_TAG_ID}');`,
                }}
              />
            </>
          )}
        {import.meta.env.VITE_CHANNEL_PLUGIN_KEY &&
          import.meta.env.VITE_CHANNEL_PLUGIN_KEY !== "" && (
            <script
              dangerouslySetInnerHTML={{
                __html: `(function(){var w=window;if(w.ChannelIO){return w.console.error("ChannelIO script included twice.");}var ch=function(){ch.c(arguments);};ch.q=[];ch.c=function(args){ch.q.push(args);};w.ChannelIO=ch;function l(){if(w.ChannelIOInitialized){return;}w.ChannelIOInitialized=true;var s=document.createElement("script");s.type="text/javascript";s.async=true;s.src="https://cdn.channel.io/plugin/ch-plugin-web.js";var x=document.getElementsByTagName("script")[0];if(x.parentNode){x.parentNode.insertBefore(s,x);}}if(document.readyState==="complete"){l();}else{w.addEventListener("DOMContentLoaded",l);w.addEventListener("load",l);}})();
            ChannelIO('boot', {
              "pluginKey": "${import.meta.env.VITE_CHANNEL_PLUGIN_KEY}"
            });
`,
              }}
            ></script>
          )}
      </body>
    </html>
  );
}

/**
 * 메인 애플리케이션 컴포넌트
 *
 * React Router에 의해 렌더링되는 주요 컴포넌트입니다.
 * 전역 UI 요소, 진행 표시기 및 네비게이션을 처리합니다.
 *
 * 주요 책임:
 * 1. 네비게이션을 위한 진행 표시기 설정 (NProgress)
 * 2. Supabase 인증 리다이렉트 처리
 * 3. 전역 UI 컨텍스트 제공 (Sheet 및 Dialog 컴포넌트)
 */
export default function App() {
  const navigation = useNavigation();

  // 네비게이션 중 더 나은 UX를 위해 스피너가 있는 NProgress 초기화
  useEffect(() => {
    NProgress.configure({ showSpinner: true });
  }, []);

  // 네비게이션 상태에 따라 진행 표시줄 표시/숨김
  useEffect(() => {
    if (navigation.state === "loading") {
      NProgress.start();
    } else if (navigation.state === "idle") {
      NProgress.done();
    }
  }, [navigation.state]);

  // Supabase 인증 리다이렉트 처리
  // Supabase 인증 문제에 대한 임시 해결책: https://github.com/supabase/auth/issues/1927
  // TODO: 문제가 해결되면 제거
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (location.pathname === "/") {
      const error = searchParams.get("error");
      const code = searchParams.get("code");
      if (error) {
        // 인증 실패 시 에러 페이지로 리다이렉트
        navigate(`/error?${searchParams.toString()}`);
      } else if (code) {
        // 인증 성공 시 대시보드로 리다이렉트
        navigate(`/dashboard/account`);
      }
    }
  }, [searchParams]);

  return (
    <Sheet>
      <Dialog>
        <Outlet />
      </Dialog>
    </Sheet>
  );
}

/**
 * 전역 에러 바운더리 컴포넌트
 *
 * 이 컴포넌트는 애플리케이션 어디서든 렌더링 중 발생하는 에러를
 * 포착하고 표시합니다. 다음을 기반으로 다른 동작을 제공합니다:
 * - 에러 유형 (라우트 에러 vs JavaScript 에러)
 * - 환경 (개발 vs 프로덕션)
 *
 * 주요 기능:
 * - 커스텀 NotFound 컴포넌트를 사용한 404 에러 특별 처리
 * - 프로덕션 환경에서 Sentry로 에러 보고
 * - 개발 모드에서 상세한 스택 트레이스
 * - 프로덕션 환경에서 사용자 친화적인 에러 메시지
 *
 * @param error - React Router에 의해 포착된 에러
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    // 라우트 에러 처리 (404, 500 등)
    if (error.status === 404) {
      // "찾을 수 없음" 에러에 대한 커스텀 404 페이지 표시
      return <NotFound />;
    }
    message = "Error";
    details = error.statusText || details;
  } else if (error && error instanceof Error) {
    // JavaScript 에러 처리
    if (
      import.meta.env.VITE_SENTRY_DSN &&
      import.meta.env.MODE === "production"
    ) {
      // 프로덕션 환경에서 Sentry로 에러 보고
      Sentry.captureException(error);
    }
    if (import.meta.env.DEV) {
      // 개발 환경에서 상세한 에러 정보 표시
      details = error.message;
      stack = error.stack;
    }
  }

  // 사용 가능한 정보로 간단한 에러 페이지 렌더링
  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

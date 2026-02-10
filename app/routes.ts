/**
 * 애플리케이션 라우트 설정
 *
 * 이 파일은 React Router의 파일 기반 라우팅 시스템을 사용하여
 * 애플리케이션의 모든 라우트를 정의합니다. 라우트는 기능 및 접근 수준별로 구성됩니다.
 *
 * 구조는 공유 UI 요소를 위한 레이아웃과 라우트 그룹화를 위한 접두사를 사용합니다.
 * 이 접근 방식은 유지보수가 가능하고 확장 가능한 계층적 라우팅 시스템을 만듭니다.
 */
import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  // ============================================================================
  // 정적 파일 라우트
  // ============================================================================
  route("/robots.txt", "core/screens/robots.ts"),
  route("/sitemap.xml", "core/screens/sitemap.ts"),

  // ============================================================================
  // 디버그 라우트 (프로덕션에서는 삭제해야 합니다)
  // ============================================================================
  ...prefix("/debug", [
    route("/sentry", "debug/sentry.tsx"),
    route("/analytics", "debug/analytics.tsx"),
  ]),

  // ============================================================================
  // API 라우트 (액션과 로더를 내보내지만 UI는 없는 라우트)
  // ============================================================================
  ...prefix("/api", [
    ...prefix("/settings", [
      route("/theme", "features/settings/api/set-theme.tsx"),
      route("/locale", "features/settings/api/set-locale.tsx"),
    ]),
    ...prefix("/users", [
      index("features/users/api/delete-account.tsx"),
      route("/password", "features/users/api/change-password.tsx"),
      route("/email", "features/users/api/change-email.tsx"),
      route("/profile", "features/users/api/edit-profile.tsx"),
      route("/providers", "features/users/api/connect-provider.tsx"),
      route(
        "/providers/:provider",
        "features/users/api/disconnect-provider.tsx",
      ),
    ]),
    ...prefix("/cron", [route("/mailer", "features/cron/api/mailer.tsx")]),
    ...prefix("/blog", [route("/og", "features/blog/api/og.tsx")]),
  ]),

  // ============================================================================
  // 네비게이션 레이아웃 (모든 공개 페이지에 네비게이션 바 포함)
  // ============================================================================
  layout("core/layouts/navigation.layout.tsx", [
    // 기본 라우트
    route("/auth/confirm", "features/auth/screens/confirm.tsx"),
    index("features/home/screens/home.tsx"),
    route("/error", "core/screens/error.tsx"),

    // 공개 인덱스 페이지들 (로그인 불필요, 누구나 접근 가능)
    ...prefix("/class", [
      index("features/class/screens/class.tsx"),
    ]),
    ...prefix("/news", [
      index("features/news/screens/news.tsx"),
    ]),

    // 공개 레이아웃 (인증되지 않은 사용자만 접근 가능, 로그인 시 대시보드로 리다이렉트)
    layout("core/layouts/public.layout.tsx", [
      route("/login", "features/auth/screens/login.tsx"),
      route("/join", "features/auth/screens/join.tsx"),
      ...prefix("/auth", [
        route("/api/resend", "features/auth/api/resend.tsx"),
        route(
          "/forgot-password/reset",
          "features/auth/screens/forgot-password.tsx",
        ),
        route("/magic-link", "features/auth/screens/magic-link.tsx"),
        ...prefix("/otp", [
          route("/start", "features/auth/screens/otp/start.tsx"),
          route("/complete", "features/auth/screens/otp/complete.tsx"),
        ]),
        ...prefix("/social", [
          route("/start/:provider", "features/auth/screens/social/start.tsx"),
          route(
            "/complete/:provider",
            "features/auth/screens/social/complete.tsx",
          ),
        ]),
      ]),
    ]),

    // 인증이 필요한 상세 페이지들 (로그인하지 않은 사용자는 /login으로 리다이렉트)
    layout("core/layouts/private.layout.tsx", { id: "private-content" }, [
      route("/class/:slug", "features/class/screens/class-detail.tsx"),
      ...prefix("/gallery", [
        index("features/gallery/screens/gallery.tsx"),
        route("/:slug", "features/gallery/screens/gallery-detail.tsx"),
      ]),
      route("/news/:slug", "features/news/screens/news-detail.tsx"),
    ]),

    // 인증이 필요한 인증 관련 라우트
    layout("core/layouts/private.layout.tsx", { id: "private-auth" }, [
      ...prefix("/auth", [
        route(
          "/forgot-password/create",
          "features/auth/screens/new-password.tsx",
        ),
        route("/email-verified", "features/auth/screens/email-verified.tsx"),
      ]),
      route("/logout", "features/auth/screens/logout.tsx"),
    ]),

    // 공개 접근 가능한 기타 라우트
    route("/contact", "features/contact/screens/contact-us.tsx"),

    // 결제 관련 라우트
    ...prefix("/payments", [
      route("/checkout", "features/payments/screens/checkout.tsx"),
      // 결제 성공/실패 페이지는 인증 필요
      layout("core/layouts/private.layout.tsx", { id: "private-payments" }, [
        route("/success", "features/payments/screens/success.tsx"),
        route("/failure", "features/payments/screens/failure.tsx"),
      ]),
    ]),
  ]),

  // ============================================================================
  // 대시보드 레이아웃 (인증 필요, 대시보드 전용 레이아웃 포함)
  // ============================================================================
  layout("core/layouts/private.layout.tsx", { id: "private-dashboard" }, [
    layout("features/users/layouts/dashboard.layout.tsx", [
      ...prefix("/dashboard", [
        index("features/users/screens/dashboard.tsx"),
        route("/payments", "features/payments/screens/payments.tsx"),
      ]),
      route("/account/edit", "features/users/screens/account.tsx"),
    ]),
  ]),

  // ============================================================================
  // 법적 문서 라우트 (공개 접근 가능)
  // ============================================================================
  ...prefix("/legal", [route("/:slug", "features/legal/screens/policy.tsx")]),

  // ============================================================================
  // 블로그 레이아웃 (공개 접근 가능, 블로그 전용 레이아웃 포함)
  // ============================================================================
  layout("features/blog/layouts/blog.layout.tsx", [
    ...prefix("/blog", [
      index("features/blog/screens/posts.tsx"),
      route("/:slug", "features/blog/screens/post.tsx"),
    ]),
  ]),
] satisfies RouteConfig;

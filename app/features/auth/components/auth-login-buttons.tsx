/**
 * 인증 로그인 버튼 모듈
 *
 * 이 모듈은 다양한 인증 옵션을 일관되고 스타일링된 방식으로 렌더링하기 위한
 * 재사용 가능한 컴포넌트를 제공합니다. 다음을 포함한 여러 인증 방법을 지원합니다:
 * - 소셜 로그인 (Google, GitHub, Apple, Kakao)
 * - 비밀번호 없는 옵션 (OTP, Magic Link)
 *
 * 컴포넌트는 적절한 시각적 구분과 일관된 스타일링으로 로그인 및 회원가입 흐름 모두에서
 * 사용하도록 설계되었습니다. 각 버튼에는 사용성을 향상시키기 위해 제공자의 로고와
 * 설명 텍스트가 포함됩니다.
 *
 * 이 모듈식 접근 방식은 주요 인증 화면을 수정하지 않고도 인증 방법을 쉽게 추가하거나
 * 제거할 수 있게 합니다.
 */
import { LockIcon, MailIcon, PhoneIcon } from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";

import { AppleLogo } from "./logos/apple";
import { GithubLogo } from "./logos/github";
import { GoogleLogo } from "./logos/google";
import { KakaoLogo } from "./logos/kakao";

/**
 * 일반 인증 버튼 컴포넌트
 *
 * 이 컴포넌트는 모든 인증 제공자에 대해 일관된 버튼을 렌더링합니다.
 * 제공자의 로고와 표준화된 "Continue with [Provider]" 텍스트를 포함합니다.
 * 버튼은 깔끔한 외관을 위해 outline 변형을 사용하며 적절한 인증 흐름으로 연결됩니다.
 *
 * @param logo - 제공자의 로고를 나타내는 React 노드
 * @param label - 제공자 이름 (예: "Google", "Apple")
 * @param href - 이 제공자에 대한 인증 흐름의 URL 경로
 */
function AuthLoginButton({
  logo,
  label,
  href,
}: {
  logo: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Button
      variant="outline"
      className="inline-flex items-center justify-center gap-2"
      asChild
    >
      <Link to={href}>
        <span>{logo}</span>
        <span>{label}로 계속하기</span>
      </Link>
    </Button>
  );
}

/**
 * "OR" 텍스트가 있는 시각적 구분선
 *
 * 이 컴포넌트는 두 줄 사이에 "OR" 텍스트가 중앙에 배치된 수평 구분선을 만듭니다.
 * 다른 인증 방법 그룹(예: 소셜 로그인과 비밀번호 없는 옵션)을 시각적으로 구분하는 데 사용됩니다.
 */
function Divider() {
  return (
    <div className="flex items-center gap-4">
      <span className="bg-input h-px w-full"></span>
      <span className="text-muted-foreground text-xs">OR</span>
      <span className="bg-input h-px w-full"></span>
    </div>
  );
}

/**
 * 비밀번호 없는 인증 옵션
 *
 * 이 컴포넌트는 비밀번호 없는 인증 방법에 대한 버튼을 렌더링합니다:
 * - OTP (일회용 비밀번호) 인증
 * - Magic Link 이메일 인증
 *
 * 이러한 방법은 전통적인 비밀번호 기반 또는 소셜 로그인 접근 방식에 대한
 * 대안을 제공하여 접근성과 보안을 향상시킵니다.
 *
 * 참고: 언더스코어 접두사(_SignInButtons)는 이 모듈 내에서 내부 사용을 위한
 * 비공개 컴포넌트임을 나타냅니다.
 */

// 비밀번호 없는 인증 옵션(OTP, Magic Link)
function _SignInButtons() {
  return (
    <>
      <AuthLoginButton
        logo={<LockIcon className="size-4 scale-110 dark:text-white" />}
        label="OTP"
        href="/auth/otp/start"
      />
      <AuthLoginButton
        logo={<MailIcon className="size-4 scale-110 dark:text-white" />}
        label="Magic Link"
        href="/auth/magic-link"
      />
    </>
  );
}

/**
 * 소셜 로그인 인증 옵션
 *
 * 이 컴포넌트는 다음 소셜 인증 제공자에 대한 버튼을 렌더링합니다:
 * - Google
 * - GitHub
 * - Apple
 * - Kakao
 *
 * 각 버튼은 제공자의 공식 로고를 사용하고 적절한 OAuth 흐름으로 연결됩니다.
 * 각 제공자의 로고 표시에 대한 브랜드 가이드라인을 존중하면서 스타일링은 일관됩니다.
 */

// 소셜 로그인 인증 옵션(Google, GitHub, Apple, Kakao)
function SocialLoginButtons() {
  return (
    <>
      <AuthLoginButton
        logo={<KakaoLogo className="size-4 scale-125 dark:text-yellow-300" />}
        label="카카오"
        href="/auth/social/start/kakao"
      />
      <AuthLoginButton
        logo={<GithubLogo className="size-4 scale-125 dark:text-white" />}
        label="깃허브"
        href="/auth/social/start/github"
      />

      {/* <AuthLoginButton
        logo={<GoogleLogo className="size-4" />}
        label="Google"
        href="/auth/social/start/google"
      /> */}

      {/* <AuthLoginButton
        logo={<AppleLogo className="size-4 scale-150 dark:text-white" />}
        label="Apple"
        href="/auth/social/start/apple"
      /> */}
    </>
  );
}

/**
 * 로그인 인증 옵션의 전체 세트
 *
 * 이 내보낸 컴포넌트는 소셜 로그인과 비밀번호 없는 옵션을 모두 포함하여
 * 로그인 흐름에 대한 모든 인증 옵션을 제공하며, 그 사이에 구분선이 있습니다.
 *
 * 사용법:
 * ```tsx
 * <SignInButtons />
 * ```
 */
export function SignInButtons() {
  return (
    <>
      <Divider />
      <SocialLoginButtons />
      {/* <_SignInButtons /> */}
    </>
  );
}

/**
 * 회원가입 흐름을 위한 인증 옵션
 *
 * 이 내보낸 컴포넌트는 회원가입 흐름을 위해 특별히 인증 옵션을 제공합니다.
 * 비밀번호 없는 옵션이 일반적으로 새 등록보다는 기존 사용자에게 더 관련이 있기 때문에
 * 소셜 로그인 옵션만 포함합니다.
 *
 * 사용법:
 * ```tsx
 * <SignUpButtons />
 * ```
 */
export function SignUpButtons() {
  return (
    <>
      <Divider />
      <SocialLoginButtons />
    </>
  );
}

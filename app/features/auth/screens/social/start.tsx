/**
 * 소셜 인증 시작 화면
 *
 * 이 컴포넌트는 소셜 인증 제공자를 위한 OAuth 흐름을 시작합니다.
 * 타사 인증 제공자(예: GitHub, Kakao)로의 리다이렉션을 처리하고
 * 인증이 완료될 때 콜백 URL을 설정합니다.
 *
 * 소셜 인증 흐름은 두 단계로 구성됩니다:
 * 1. 이 화면: OAuth 흐름을 시작하고 제공자로 리다이렉트
 * 2. 완료 화면: 제공자로부터 콜백을 처리하고 인증 완료
 *
 * 이 구현은 Supabase의 OAuth 인증 시스템을 사용합니다.
 */
import type { Route } from "./+types/start";

import { data, redirect } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

/**
 * URL 매개변수를 검증하기 위한 스키마
 *
 * URL 매개변수에 유효한 OAuth 제공자가 지정되었는지 확인합니다
 * Supabase 대시보드에서 활성화한 대로 더 많은 제공자를 추가하세요
 */
const paramsSchema = z.object({
  provider: z.enum(["github", "kakao"]),
});

/**
 * 소셜 인증 시작 페이지의 로더 함수
 *
 * 이 함수는 지정된 제공자로 OAuth 흐름을 시작합니다:
 * 1. URL에서 제공자 매개변수 검증
 * 2. Supabase로 OAuth 흐름 초기화
 * 3. 인증이 완료될 때 리다이렉트 URL 설정
 * 4. 사용자를 제공자의 인증 페이지로 리다이렉트
 *
 * @param params - 제공자 이름을 포함하는 URL 매개변수
 * @param request - 들어오는 요청
 * @returns 제공자의 인증 페이지로 리다이렉트 또는 에러 응답
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  // 제공자 매개변수 검증
  const { error, success, data: parsedParams } = paramsSchema.safeParse(params);
  if (!success) {
    return data({ error: "Invalid provider" }, { status: 400 });
  }

  // 인증 쿠키를 위한 응답 헤더와 함께 Supabase 클라이언트 생성
  const [client, headers] = makeServerClient(request);

  // 지정된 제공자로 OAuth 흐름 초기화
  const { data: signInData, error: signInError } =
    await client.auth.signInWithOAuth({
      provider: parsedParams.provider,
      options: {
        // 인증이 완료될 때 콜백 URL 설정
        redirectTo: `${process.env.SITE_URL}/auth/social/complete/${parsedParams.provider}`,
      },
    });

  // OAuth 초기화 실패 시 에러 반환
  if (signInError) {
    return data({ error: signInError.message }, { status: 400 });
  }

  // 인증 헤더와 함께 제공자의 인증 페이지로 리다이렉트
  return redirect(signInData.url, { headers });
}

/**
 * 소셜 인증 시작 컴포넌트
 *
 * 이 컴포넌트는 OAuth 초기화 중에 에러가 있는 경우에만 렌더링됩니다.
 * 정상적인 경우, 로더 함수는 이 컴포넌트가 렌더링되기 전에 사용자를 직접
 * 인증 제공자의 로그인 페이지로 리다이렉트합니다.
 *
 * 에러가 있는 경우(예: 유효하지 않은 제공자, 네트워크 문제), 이 컴포넌트는
 * 에러 메시지를 표시하고 사용자에게 다시 시도하도록 요청합니다.
 *
 * @param loaderData - 에러 메시지를 포함하는 로더의 데이터
 */
export default function StartSocialLogin({ loaderData }: Route.ComponentProps) {
  // 로더 데이터에서 에러 추출
  const { error } = loaderData;

  return (
    <div className="flex flex-col items-center justify-center gap-2.5">
      {/* 에러 메시지 표시 */}
      <h1 className="text-2xl font-semibold">{error}</h1>
      <p className="text-muted-foreground">Please try again.</p>
    </div>
  );
}

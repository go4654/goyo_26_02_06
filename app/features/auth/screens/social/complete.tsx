/**
 * 소셜 인증 완료 화면
 *
 * 이 컴포넌트는 인증 후 타사 OAuth 제공자로부터 콜백을 처리합니다.
 * 제공자가 반환한 인증 코드를 처리하고 세션으로 교환합니다.
 *
 * 소셜 인증 흐름은 두 단계로 구성됩니다:
 * 1. 시작 화면: OAuth 흐름을 시작하고 제공자로 리다이렉트
 * 2. 이 화면: 제공자로부터 콜백을 처리하고 인증 완료
 *
 * 이 구현은 Supabase의 OAuth 인증 시스템을 사용하여 OAuth 코드를
 * 유효한 세션으로 교환하고 Supabase 데이터베이스에서 사용자를 생성하거나 업데이트합니다.
 */
import type { Route } from "./+types/complete";

import { data, redirect } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

/**
 * 소셜 인증 완료 페이지의 메타 함수
 *
 * 환경 변수에서 애플리케이션 이름을 사용하여 페이지 제목 설정
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Confirm | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * 성공적인 OAuth 콜백 매개변수를 검증하기 위한 스키마
 *
 * OAuth 흐름이 성공하면 제공자가 세션으로 교환할 수 있는 코드와 함께
 * 리다이렉트합니다
 */
const searchParamsSchema = z.object({
  code: z.string(),
});

/**
 * OAuth 제공자로부터 에러 매개변수를 검증하기 위한 스키마
 *
 * OAuth 흐름이 실패하면(예: 사용자가 권한 거부), 제공자가 표준 OAuth 에러 형식으로
 * 에러 정보와 함께 리다이렉트합니다
 */
const errorSchema = z.object({
  error: z.string(),
  error_code: z.string(),
  error_description: z.string(),
});

/**
 * 소셜 인증 완료 페이지의 로더 함수
 *
 * 이 함수는 OAuth 콜백을 처리하고 인증 프로세스를 완료합니다:
 * 1. URL 쿼리 매개변수에서 코드 또는 에러 추출 및 검증
 * 2. 성공적인 흐름의 경우 Supabase로 코드를 세션으로 교환
 * 3. 에러 흐름의 경우 에러 메시지 추출 및 표시
 * 4. 인증된 사용자를 세션 쿠키와 함께 홈 페이지로 리다이렉트
 *
 * @param request - OAuth 콜백 매개변수가 포함된 들어오는 요청
 * @returns 인증 쿠키와 함께 홈 페이지로 리다이렉트 또는 에러 응답
 */
export async function loader({ request }: Route.LoaderArgs) {
  // URL에서 쿼리 매개변수 추출
  const { searchParams } = new URL(request.url);
  
  // 성공적인 OAuth 콜백으로 매개변수 검증 시도
  const { success, data: validData } = searchParamsSchema.safeParse(
    Object.fromEntries(searchParams),
  );
  
  // 성공적인 콜백이 아닌 경우 에러 콜백인지 확인
  if (!success) {
    const { data: errorData, success: errorSuccess } = errorSchema.safeParse(
      Object.fromEntries(searchParams),
    );
    
    // 성공적인 콜백도 에러 콜백도 아닌 경우 일반 에러 반환
    if (!errorSuccess) {
      return data({ error: "Invalid code" }, { status: 400 });
    }
    
    // 제공자로부터 에러 설명 반환
    return data({ error: errorData.error_description }, { status: 400 });
  }

  // 인증 쿠키를 위한 응답 헤더와 함께 Supabase 클라이언트 생성
  const [client, headers] = makeServerClient(request);
  
  // OAuth 코드를 세션으로 교환
  const { error } = await client.auth.exchangeCodeForSession(validData.code);

  // 세션 교환 실패 시 에러 반환
  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // 헤더에 인증 쿠키와 함께 홈 페이지로 리다이렉트
  return redirect("/", { headers });
}

/**
 * 소셜 인증 완료 컴포넌트
 *
 * 이 컴포넌트는 OAuth 콜백 처리 중에 에러가 있는 경우에만 렌더링됩니다.
 * 정상적인 경우, 로더 함수는 성공적인 인증 후 이 컴포넌트가 렌더링되기 전에
 * 사용자를 직접 홈 페이지로 리다이렉트합니다.
 *
 * 에러가 있는 경우(예: 유효하지 않은 코드, 사용자가 인증 거부, 네트워크 문제),
 * 이 컴포넌트는 사용자에게 실패에 대해 알리기 위해 에러 메시지를 표시합니다.
 *
 * @param loaderData - 에러 메시지를 포함하는 로더의 데이터
 */
export default function Confirm({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5">
      {/* 에러 제목 표시 */}
      <h1 className="text-2xl font-semibold">Login failed</h1>
      {/* 제공자 또는 Supabase의 특정 에러 메시지 표시 */}
      <p className="text-muted-foreground">{loaderData.error}</p>
    </div>
  );
}

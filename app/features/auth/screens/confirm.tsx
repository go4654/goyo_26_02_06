/**
 * 이메일 확인 화면
 *
 * 이 컴포넌트는 다양한 이메일 관련 작업의 확인을 처리합니다:
 * - 새 계정의 이메일 인증
 * - 비밀번호 복구 확인
 * - 이메일 변경 확인
 *
 * 사용자가 Supabase에서 보낸 인증 이메일의 링크를 클릭하면 토큰 해시와
 * 타입 매개변수와 함께 이 페이지로 이동합니다. 이 컴포넌트는 Supabase로
 * 토큰을 확인하고 해당 작업을 완료합니다.
 *
 * 이는 민감한 계정 작업을 완료하기 전에 이메일 소유권을 보장하는 중요한 보안 컴포넌트입니다.
 */
import type { Route } from "./+types/confirm";

import { data, redirect } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

/**
 * 확인 페이지의 메타 함수
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
 * 확인 링크의 URL 매개변수를 검증하기 위한 스키마
 *
 * 스키마는 세 가지 주요 매개변수를 검증합니다:
 * - token_hash: Supabase에서 제공한 인증 토큰
 * - type: 확인 유형 (이메일 인증, 비밀번호 복구 또는 이메일 변경)
 * - next: 성공적인 확인 후 리다이렉트할 URL (기본값은 홈 페이지)
 */
const searchParamsSchema = z.object({
  token_hash: z.string(),
  type: z.enum(["email", "recovery", "email_change"]),
  next: z.string().default("/"),
});

/**
 * 확인 페이지의 로더 함수
 *
 * 이 함수는 인증 토큰을 처리하고 해당 작업을 완료합니다:
 * 1. 쿼리 매개변수에서 토큰 해시, 타입 및 다음 URL 검증
 * 2. Supabase 인증으로 토큰 확인
 * 3. 이메일 변경 확인의 경우 성공 메시지와 함께 리다이렉트
 * 4. 기타 확인의 경우 지정된 다음 URL로 리다이렉트
 *
 * 함수는 세 가지 유형의 확인을 처리합니다:
 * - email: 새 계정의 이메일 인증
 * - recovery: 비밀번호 복구 확인
 * - email_change: 이메일 변경 확인
 *
 * @param request - 확인 매개변수가 포함된 들어오는 요청
 * @returns 인증 쿠키가 있는 다음 URL로 리다이렉트 또는 에러 응답
 */
export async function loader({ request }: Route.LoaderArgs) {
  // URL에서 쿼리 매개변수 추출
  const { searchParams } = new URL(request.url);

  // 확인 매개변수 검증
  const { success, data: validData } = searchParamsSchema.safeParse(
    Object.fromEntries(searchParams),
  );

  // 매개변수가 유효하지 않은 경우 에러 반환
  if (!success) {
    return data({ error: "Invalid confirmation code" }, { status: 400 });
  }

  // 인증 쿠키를 위한 응답 헤더와 함께 Supabase 클라이언트 생성
  const [client, headers] = makeServerClient(request);

  // Supabase로 토큰 확인
  const { error, data: verifyOtpData } = await client.auth.verifyOtp({
    ...validData,
  });

  // 확인 실패 시 에러 반환
  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // 이메일 변경 확인에 대한 특별 처리
  if (validData.type === "email_change") {
    return redirect(
      // @ts-ignore - Supabase는 이메일 변경에 대해 사용자 객체에 메시지를 반환합니다
      `${validData.next}?message=${encodeURIComponent(verifyOtpData.user.msg ?? "Your email has been updated")}`,
      { headers },
    );
  }

  // 헤더에 인증 쿠키가 있는 다음 URL로 리다이렉트
  return redirect(validData.next, { headers });
}

/**
 * 이메일 확인 컴포넌트
 *
 * 이 컴포넌트는 확인 과정 중에 에러가 있는 경우에만 렌더링됩니다.
 * 정상적인 경우, 로더 함수는 성공적인 확인 후 이 컴포넌트가 렌더링되기 전에
 * 사용자를 직접 다음 URL로 리다이렉트합니다.
 *
 * 에러가 있는 경우(예: 만료된 토큰, 유효하지 않은 토큰, 이미 확인됨),
 * 이 컴포넌트는 사용자에게 실패에 대해 알리기 위해 에러 메시지를 표시합니다.
 *
 * @param loaderData - 에러 메시지를 포함하는 로더의 데이터
 */
export default function Confirm({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5">
      {/* 에러 제목 표시 */}
      <h1 className="text-2xl font-semibold">Confirmation failed</h1>
      {/* Supabase의 특정 에러 메시지 표시 */}
      <p className="text-muted-foreground">{loaderData.error}</p>
    </div>
  );
}

/**
 * 이메일 인증 재전송 API 엔드포인트
 *
 * 이 모듈은 회원가입 과정에서 사용자에게 인증 이메일을 재전송하는 API 엔드포인트를 제공합니다.
 * 사용자가 초기 인증 이메일을 받지 못했거나 인증 링크가 만료된 경우 사용됩니다.
 *
 * 엔드포인트는 다음을 수행합니다:
 * - Zod 스키마 검증을 사용하여 이메일 주소 검증
 * - 적절한 쿠키 처리가 포함된 서버 사이드 Supabase 클라이언트 생성
 * - Supabase의 인증 이메일 재전송 API 호출
 * - 적절한 성공 또는 에러 응답 반환
 *
 * 이는 사용자가 애플리케이션에 대한 전체 액세스를 얻기 전에 이메일 주소를
 * 확인하도록 보장하는 인증 흐름의 일부입니다.
 */
import type { Route } from "./+types/resend";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

/**
 * 이메일 재전송 요청을 위한 검증 스키마
 * 
 * 이 스키마는 인증 이메일을 재전송하기 전에 제출된 이메일 주소가
 * 유효한지 확인합니다. 더 나은 사용자 피드백을 위해 사용자 정의 에러 메시지가
 * 포함된 Zod의 이메일 검증기를 사용합니다.
 */
const resendSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

/**
 * 인증 이메일 재전송을 위한 액션 핸들러
 * 
 * 이 함수는 회원가입 과정에서 사용자에게 인증 이메일을 재전송하는 요청을 처리합니다.
 * 다음 단계를 따릅니다:
 * 1. 폼 데이터에서 이메일을 추출하고 검증
 * 2. 적절한 인증 컨텍스트가 포함된 서버 사이드 Supabase 클라이언트 생성
 * 3. 회원가입 타입으로 Supabase의 재전송 API 호출
 * 4. 인증 페이지로 리다이렉트 URL 설정
 * 5. 적절한 성공 또는 에러 응답 반환
 * 
 * 보안 고려사항:
 * - 잘못된 형식의 요청을 방지하기 위해 이메일 형식 검증
 * - 클라이언트 사이드 우회를 방지하기 위해 서버 사이드 검증 사용
 * - 이메일 열거를 방지하기 위해 일반적인 에러 메시지 반환
 * 
 * @param request - 폼 데이터가 포함된 들어오는 HTTP 요청
 * @returns 성공 또는 에러를 나타내는 JSON 응답
 */
export async function action({ request }: Route.ActionArgs) {
  // 요청에서 폼 데이터 추출
  const formData = await request.formData();

  // Zod 스키마를 사용하여 이메일 주소 검증
  const { success, data: validData } = resendSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!success) {
    // 검증 실패 시 에러 응답 반환
    return data({ error: "Invalid email address" }, { status: 400 });
  }

  // 적절한 쿠키 처리가 포함된 서버 사이드 Supabase 클라이언트 생성
  const [client] = makeServerClient(request);

  // 새로운 인증 이메일을 보내기 위해 Supabase의 재전송 API 호출
  const { error } = await client.auth.resend({
    type: "signup", // 이것이 회원가입 인증용임을 지정
    email: validData.email,
    options: {
      // 인증 링크의 리다이렉트 URL 설정
      emailRedirectTo: `${process.env.SITE_URL}/auth/verify`,
    },
  });

  // Supabase API의 모든 에러 처리
  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // 이메일이 성공적으로 전송된 경우 성공 응답 반환
  return data({ success: true }, { status: 200 });
}

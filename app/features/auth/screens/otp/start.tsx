/**
 * 일회용 비밀번호(OTP) 인증 시작 화면
 *
 * 이 컴포넌트는 OTP 인증 흐름의 첫 번째 단계를 처리합니다:
 * 사용자가 이메일을 입력하여 인증 코드를 받을 수 있도록 합니다.
 *
 * OTP 흐름은 두 단계로 구성됩니다:
 * 1. 이 화면: 사용자가 이메일을 입력하여 인증 코드를 받음
 * 2. 완료 화면: 사용자가 받은 코드를 입력하여 인증
 *
 * 이 구현은 Supabase의 OTP 인증 시스템을 사용합니다.
 */
import type { Route } from "./+types/start";

import { Form, data, redirect } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * OTP 시작 페이지의 메타 함수
 *
 * 환경 변수에서 애플리케이션 이름을 사용하여 페이지 제목 설정
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `OTP Login | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * OTP 시작을 위한 폼 검증 스키마
 *
 * 인증 코드를 보내기 전에 유효한 이메일 형식인지 확인하기 위해
 * Zod를 사용하여 이메일 필드 검증
 */
const otpStartSchema = z.object({
  email: z.string().email(),
});

/**
 * OTP 시작 폼 제출을 처리하는 서버 액션
 *
 * 이 함수는 폼 데이터를 처리하고 OTP 인증 코드를 보내려고 시도합니다.
 * 흐름은 다음과 같습니다:
 * 1. 스키마를 사용하여 이메일 파싱 및 검증
 * 2. 이메일이 유효하지 않은 경우 검증 에러 반환
 * 3. Supabase auth에서 OTP 이메일 요청
 * 4. OTP 완료 페이지로 리다이렉트 또는 에러 반환
 *
 * 참고: shouldCreateUser: false 옵션은 기존 사용자만 OTP 인증을
 * 사용할 수 있도록 보장하여 계정 열거를 방지합니다.
 *
 * @param request - 폼 제출 요청
 * @returns 검증 에러, 인증 에러 또는 OTP 완료 페이지로 리다이렉트
 */
export async function action({ request }: Route.ActionArgs) {
  // 폼 데이터 파싱 및 검증
  const formData = await request.formData();
  const { success, data: validData } = otpStartSchema.safeParse(
    Object.fromEntries(formData),
  );

  // 이메일이 유효하지 않은 경우 검증 에러 반환
  if (!success) {
    return data({ error: "Invalid email" }, { status: 400 });
  }

  // Supabase 클라이언트 생성
  const [client] = makeServerClient(request);

  // Supabase에서 OTP 이메일 요청
  const { error } = await client.auth.signInWithOtp({
    email: validData.email,
    options: {
      // 기존 사용자만 OTP로 로그인할 수 있도록 허용
      shouldCreateUser: false,
    },
  });

  // 요청 실패 시 에러 반환
  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // 쿼리 매개변수에 이메일이 포함된 OTP 완료 페이지로 리다이렉트
  return redirect(`/auth/otp/complete?email=${validData.email}`);
}

/**
 * OTP 인증 시작 컴포넌트
 *
 * 이 컴포넌트는 OTP 인증 프로세스를 시작하기 위한 폼을 렌더링합니다.
 * 다음을 포함합니다:
 * - 검증이 포함된 이메일 입력 필드
 * - 인증 코드를 요청하기 위한 제출 버튼
 * - 검증 및 서버 에러에 대한 에러 표시
 *
 * 성공적인 제출 후, 사용자는 이메일로 받은 인증 코드를 입력할 수 있는
 * OTP 완료 페이지로 리다이렉트됩니다.
 *
 * @param actionData - 에러를 포함하는 폼 액션에서 반환된 데이터
 */
export default function OtpStart({ actionData }: Route.ComponentProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        {/* 제목과 설명이 있는 카드 헤더 */}
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">
            이메일을 입력해주세요.
          </CardTitle>
          <CardDescription className="text-center text-sm">
            인증 코드를 보내드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* OTP 요청 폼 */}
          <Form className="flex w-full flex-col gap-4" method="post">
            {/* 이메일 입력 필드 */}
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="name" className="flex flex-col items-start gap-1">
                이메일
              </Label>
              <Input
                id="email"
                name="email"
                required
                type="email"
                placeholder="이메일을 입력해주세요."
                className="h-12 rounded-2xl placeholder:text-sm"
              />
            </div>
            {/* 제출 버튼 */}
            <FormButton
              label="인증 코드 보내기"
              className="h-12 w-full cursor-pointer rounded-2xl text-base"
            />
            {/* 에러 메시지 표시 */}
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors errors={[actionData.error]} />
            ) : null}
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

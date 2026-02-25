/**
 * 비밀번호 재설정 요청 화면 컴포넌트
 *
 * 이 컴포넌트는 비밀번호 재설정 흐름의 첫 번째 단계를 처리합니다:
 * 사용자가 이메일을 통해 비밀번호 재설정 링크를 요청할 수 있도록 합니다.
 *
 * 컴포넌트는 다음을 포함합니다:
 * - 검증이 포함된 이메일 입력 필드
 * - 폼 제출 처리
 * - 재설정 링크 전송 후 성공 확인
 * - 유효하지 않은 이메일 또는 서버 문제에 대한 에러 처리
 */
import type { Route } from "./+types/forgot-password";

import { useEffect, useRef } from "react";
import { Form, data } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import FormSuccess from "~/core/components/form-success";
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
 * 비밀번호 찾기 페이지의 메타 함수
 *
 * 환경 변수에서 애플리케이션 이름을 사용하여 페이지 제목 설정
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `비밀번호 재설정 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * 비밀번호 재설정 요청을 위한 폼 검증 스키마
 *
 * 재설정 링크를 보내기 전에 유효한 이메일 형식인지 확인하기 위해
 * Zod를 사용하여 이메일 필드 검증
 */
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "유효한 이메일 주소를 입력해주세요." }),
});

/** 비밀번호 재설정 관련 영문 에러 메시지를 한글로 매핑 */
const FORGOT_PASSWORD_ERROR_MESSAGES: Record<string, string> = {
  "Email rate limit exceeded":
    "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  "For security purposes, you can only request this once every 60 seconds":
    "보안을 위해 60초에 한 번만 요청할 수 있습니다.",
};

function getForgotPasswordErrorMessage(enMessage: string): string {
  return FORGOT_PASSWORD_ERROR_MESSAGES[enMessage] ?? enMessage;
}

/**
 * 비밀번호 재설정 요청 폼 제출을 처리하는 서버 액션
 *
 * 이 함수는 폼 데이터를 처리하고 비밀번호 재설정 이메일을 보내려고 시도합니다.
 * 흐름은 다음과 같습니다:
 * 1. 스키마를 사용하여 이메일 파싱 및 검증
 * 2. 이메일이 유효하지 않은 경우 검증 에러 반환
 * 3. Supabase auth에서 비밀번호 재설정 이메일 요청
 * 4. 성공 또는 에러 응답 반환
 *
 * 참고: 보안상의 이유로 이 엔드포인트는 이메일이 시스템에 존재하지 않더라도
 * 성공을 반환하여 이메일 열거 공격을 방지합니다.
 *
 * @param request - 폼 제출 요청
 * @returns 검증 에러, 인증 에러 또는 성공 확인
 */
export async function action({ request }: Route.ActionArgs) {
  // 폼 데이터 파싱 및 검증
  const formData = await request.formData();
  const result = forgotPasswordSchema.safeParse(Object.fromEntries(formData));

  // 이메일이 유효하지 않은 경우 검증 에러 반환
  if (!result.success) {
    return data(
      { fieldErrors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  // Supabase 클라이언트 생성
  const [client] = makeServerClient(request);

  // Supabase에서 비밀번호 재설정 이메일 요청
  const { error } = await client.auth.resetPasswordForEmail(result.data.email);

  // 요청 실패 시 에러 반환 (한글 메시지로 변환)
  if (error) {
    return data(
      { error: getForgotPasswordErrorMessage(error.message) },
      { status: 400 },
    );
  }

  // 성공 응답 반환
  return { success: true };
}

/**
 * 비밀번호 재설정 요청 컴포넌트
 *
 * 이 컴포넌트는 비밀번호 재설정 링크를 요청하기 위한 폼을 렌더링합니다.
 * 다음을 포함합니다:
 * - 검증이 포함된 이메일 입력 필드
 * - 재설정 링크를 요청하기 위한 제출 버튼
 * - 검증 및 서버 에러에 대한 에러 표시
 * - 재설정 링크 전송 후 성공 확인 메시지
 *
 * @param actionData - 에러 또는 성공 상태를 포함하는 폼 액션에서 반환된 데이터
 */
export default function ForgotPassword({ actionData }: Route.ComponentProps) {
  // 성공적인 제출 후 재설정을 위한 폼 요소 참조
  const formRef = useRef<HTMLFormElement>(null);

  // 재설정 링크가 성공적으로 전송되면 폼 재설정
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      formRef.current?.reset();
      formRef.current?.blur();
    }
  }, [actionData]);
  return (
    <div className="mt-10 flex items-center justify-center xl:mt-12">
      <Card className="w-full max-w-md py-10">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">
            비밀번호를 잊으셨나요?
          </CardTitle>
          <CardDescription className="text-center text-sm">
            이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form
            className="flex w-full flex-col gap-5"
            method="post"
            ref={formRef}
          >
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
                className="xl:h-12 xl:rounded-2xl"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.email ? (
                <FormErrors errors={actionData.fieldErrors.email} />
              ) : null}
            </div>
            <FormButton
              label="비밀번호 재설정 링크 보내기"
              className="w-full cursor-pointer xl:h-12 xl:rounded-2xl"
            />
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors
                errors={[
                  getForgotPasswordErrorMessage(String(actionData.error)),
                ]}
              />
            ) : null}
            {actionData && "success" in actionData && actionData.success ? (
              <FormSuccess message="이메일을 확인하고 링크를 클릭하여 계속해주세요. " />
            ) : null}
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Magic Link 인증 화면 컴포넌트
 *
 * 이 컴포넌트는 magic link를 통한 비밀번호 없는 인증을 처리합니다.
 * 사용자가 이메일을 입력하면 자동으로 로그인하는 링크를 받습니다.
 *
 * 컴포넌트는 다음을 포함합니다:
 * - 검증이 포함된 이메일 입력 필드
 * - 폼 제출 처리
 * - magic link 전송 후 성공 확인
 * - 유효하지 않은 이메일 또는 존재하지 않는 계정에 대한 에러 처리
 */
import type { Route } from "./+types/magic-link";

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
 * magic link 페이지의 메타 함수
 *
 * 환경 변수에서 애플리케이션 이름을 사용하여 페이지 제목 설정
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `링크 전송 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * magic link 인증을 위한 폼 검증 스키마
 *
 * magic link를 보내기 전에 유효한 이메일 형식인지 확인하기 위해
 * Zod를 사용하여 이메일 필드 검증
 */
const magicLinkSchema = z.object({
  email: z.string().email(),
});

/**
 * magic link 인증 폼 제출을 처리하는 서버 액션
 *
 * 이 함수는 폼 데이터를 처리하고 magic link 이메일을 보내려고 시도합니다.
 * 흐름은 다음과 같습니다:
 * 1. 스키마를 사용하여 이메일 파싱 및 검증
 * 2. 이메일이 유효하지 않은 경우 검증 에러 반환
 * 3. Supabase auth에서 일회용 비밀번호(OTP) 이메일 요청
 * 4. 존재하지 않는 사용자와 같은 특정 에러 처리
 * 5. 성공 또는 에러 응답 반환
 *
 * 참고: shouldCreateUser: false 옵션은 기존 사용자만 magic link 인증을
 * 사용할 수 있도록 보장하여 계정 열거를 방지합니다.
 *
 * @param request - 폼 제출 요청
 * @returns 검증 에러, 인증 에러 또는 성공 확인
 */
export async function action({ request }: Route.ActionArgs) {
  // 요청에서 폼 데이터 파싱
  const formData = await request.formData();
  const { success, data: validData } = magicLinkSchema.safeParse(
    Object.fromEntries(formData),
  );

  // 이메일이 유효하지 않은 경우 검증 에러 반환
  if (!success) {
    return data({ error: "Invalid email" }, { status: 400 });
  }

  // Supabase 클라이언트 생성
  const [client] = makeServerClient(request);

  // Supabase에서 magic link 이메일 요청
  const { error } = await client.auth.signInWithOtp({
    email: validData.email,
    options: {
      // 기존 사용자만 magic link로 로그인할 수 있도록 허용
      shouldCreateUser: false,
    },
  });

  // 특정 에러 처리
  if (error) {
    // 사용자가 존재하지 않는 경우 처리
    if (error.code === "otp_disabled") {
      return data(
        { error: "Create an account before signing in." },
        { status: 400 },
      );
    }
    // 기타 에러 처리
    return data({ error: error.message }, { status: 400 });
  }

  // 성공 응답 반환
  return {
    success: true,
  };
}

/**
 * Magic Link 인증 컴포넌트
 *
 * 이 컴포넌트는 비밀번호 없는 로그인을 위한 magic link를 요청하기 위한 폼을 렌더링합니다.
 * 다음을 포함합니다:
 * - 검증이 포함된 이메일 입력 필드
 * - magic link를 요청하기 위한 제출 버튼
 * - 검증 및 서버 에러에 대한 에러 표시
 * - magic link 전송 후 성공 확인 메시지
 *
 * @param actionData - 에러 또는 성공 상태를 포함하는 폼 액션에서 반환된 데이터
 */
export default function MagicLink({ actionData }: Route.ComponentProps) {
  // 성공적인 제출 후 재설정을 위한 폼 요소 참조
  const formRef = useRef<HTMLFormElement>(null);

  // magic link가 성공적으로 전송되면 폼 재설정
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      formRef.current?.reset();
      formRef.current?.blur();
    }
  }, [actionData]);
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">
            이메일을 입력해주세요.
          </CardTitle>
          <CardDescription className="text-center text-sm">
            링크를 전송해드립니다.
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
                className="h-12 rounded-2xl placeholder:text-sm"
              />
            </div>
            <FormButton
              label="링크 전송"
              className="h-12 w-full cursor-pointer rounded-2xl text-base"
            />
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors errors={[actionData.error]} />
            ) : null}
            {actionData && "success" in actionData && actionData.success ? (
              <FormSuccess message="이메일을 확인하고 링크를 클릭하여 계속해주세요. 이 탭을 닫을 수 있습니다." />
            ) : null}
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

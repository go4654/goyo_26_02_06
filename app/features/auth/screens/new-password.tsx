/**
 * 새 비밀번호 화면 컴포넌트
 *
 * 이 컴포넌트는 비밀번호 재설정 흐름의 두 번째 단계를 처리합니다:
 * 사용자가 재설정 링크를 클릭한 후 새 비밀번호를 만들 수 있도록 합니다.
 * 
 * 컴포넌트는 다음을 포함합니다:
 * - 검증이 포함된 비밀번호 및 확인 입력 필드
 * - 폼 제출 처리
 * - 비밀번호 업데이트 후 성공 확인
 * - 검증 문제 또는 서버 에러에 대한 에러 처리
 */
import type { Route } from "./+types/new-password";

import { CheckCircle2Icon } from "lucide-react";
import { useEffect, useRef } from "react";
import { redirect } from "react-router";
import { Form, data, useLoaderData } from "react-router";
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
 * 새 비밀번호 페이지의 메타 함수
 *
 * 환경 변수에서 애플리케이션 이름을 사용하여 페이지 제목 설정
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Update password | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * 비밀번호 업데이트를 위한 폼 검증 스키마
 *
 * Zod를 사용하여 다음을 검증합니다:
 * - Password: 최소 8자 이상이어야 함
 * - Confirm Password: 비밀번호 필드와 일치해야 함
 *
 * 스키마는 비밀번호가 일치하는지 확인하기 위한 사용자 정의 정제를 포함합니다
 */
const updatePasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

/**
 * 비밀번호 업데이트 폼 제출을 처리하는 서버 액션
 *
 * 이 함수는 폼 데이터를 처리하고 사용자의 비밀번호를 업데이트하려고 시도합니다.
 * 흐름은 다음과 같습니다:
 * 1. 사용자가 인증되었는지 확인 (재설정 링크를 클릭했는지)
 * 2. 스키마를 사용하여 새 비밀번호 파싱 및 검증
 * 3. 데이터가 유효하지 않은 경우 검증 에러 반환
 * 4. Supabase auth로 사용자의 비밀번호 업데이트
 * 5. 성공 또는 에러 응답 반환
 *
 * @param request - 폼 제출 요청
 * @returns 검증 에러, 인증 에러 또는 성공 확인
 */
export async function action({ request }: Route.ActionArgs) {
  // Supabase 클라이언트 생성 및 현재 사용자 가져오기
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  
  // 사용자가 인증되지 않은 경우 비밀번호 찾기 페이지로 리다이렉트
  // 유효한 재설정 링크 없이 이 페이지에 직접 액세스하는 것을 방지합니다
  if (!user) {
    return redirect("/auth/forgot-password");
  }
  
  // 폼 데이터 파싱 및 검증
  const formData = await request.formData();
  const {
    success,
    data: validData,
    error,
  } = updatePasswordSchema.safeParse(Object.fromEntries(formData));
  
  // 비밀번호가 유효하지 않은 경우 검증 에러 반환
  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }
  
  // Supabase로 사용자의 비밀번호 업데이트
  const { error: updateError } = await client.auth.updateUser({
    password: validData.password,
  });
  
  // 비밀번호 업데이트 실패 시 에러 반환
  if (updateError) {
    return data({ error: updateError.message }, { status: 400 });
  }
  
  // 성공 응답 반환
  return {
    success: true,
  };
}

/**
 * 비밀번호 업데이트 컴포넌트
 *
 * 이 컴포넌트는 재설정 후 새 비밀번호를 만들기 위한 폼을 렌더링합니다.
 * 다음을 포함합니다:
 * - 검증이 포함된 비밀번호 입력 필드
 * - 일치 검증이 포함된 비밀번호 확인 필드
 * - 비밀번호 업데이트를 위한 제출 버튼
 * - 검증 및 서버 에러에 대한 에러 표시
 * - 비밀번호 업데이트 후 성공 확인 메시지
 *
 * @param actionData - 에러 또는 성공 상태를 포함하는 폼 액션에서 반환된 데이터
 */
export default function ChangePassword({ actionData }: Route.ComponentProps) {
  // 성공적인 제출 후 재설정을 위한 폼 요소 참조
  const formRef = useRef<HTMLFormElement>(null);
  
  // 비밀번호가 성공적으로 업데이트되면 폼 재설정 및 블러
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      formRef.current?.reset();
      formRef.current?.blur();
      // 더 나은 UX 및 보안을 위해 모든 입력 필드 블러
      formRef.current?.querySelectorAll("input")?.forEach((input) => {
        input.blur();
      });
    }
  }, [actionData]);
  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">
            Update your password
          </CardTitle>
          <CardDescription className="text-center text-base">
            Enter your new password and confirm it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form
            className="flex w-full flex-col gap-4"
            method="post"
            ref={formRef}
          >
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="name" className="flex flex-col items-start gap-1">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                required
                type="password"
                placeholder="Enter your new password"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.password ? (
                <FormErrors errors={actionData.fieldErrors.password} />
              ) : null}
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="name" className="flex flex-col items-start gap-1">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                required
                type="password"
                placeholder="Confirm your new password"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.confirmPassword ? (
                <FormErrors errors={actionData.fieldErrors.confirmPassword} />
              ) : null}
            </div>
            <FormButton label="Update password" />
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors errors={[actionData.error]} />
            ) : null}
            {actionData && "success" in actionData && actionData.success ? (
              <div className="flex items-center justify-center gap-2 text-sm text-green-500">
                <CheckCircle2Icon className="size-4" />
                <p>Password updated successfully.</p>
              </div>
            ) : null}
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

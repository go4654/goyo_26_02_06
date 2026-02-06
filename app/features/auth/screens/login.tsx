/**
 * 로그인 화면 컴포넌트
 *
 * 이 컴포넌트는 이메일/비밀번호 로그인, 소셜 인증 제공자를 통한 사용자 인증을 처리하고
 * 비밀번호 재설정 및 이메일 인증 옵션을 제공합니다. 폼 검증, 에러 처리 및
 * Supabase 인증 통합을 보여줍니다.
 */
import type { Route } from "./+types/login";

import { AlertCircle, Loader2Icon } from "lucide-react";
import { useRef } from "react";
import { Form, Link, data, redirect, useFetcher } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/core/components/ui/alert";
import { Button } from "~/core/components/ui/button";
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

import FormErrors from "../../../core/components/form-error";
import { SignInButtons } from "../components/auth-login-buttons";

/**
 * 로그인 페이지의 메타 함수
 *
 * 환경 변수에서 애플리케이션 이름을 사용하여 페이지 제목 설정
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Log in | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * 로그인을 위한 폼 검증 스키마
 *
 * Zod를 사용하여 다음을 검증합니다:
 * - Email: 유효한 이메일 형식이어야 함
 * - Password: 최소 8자 이상이어야 함
 *
 * 사용자 피드백을 위한 에러 메시지가 제공됩니다
 */
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

/**
 * 로그인 폼 제출을 처리하는 서버 액션
 *
 * 이 함수는 로그인 폼 데이터를 처리하고 사용자를 인증하려고 시도합니다.
 * 흐름은 다음과 같습니다:
 * 1. 로그인 스키마를 사용하여 폼 데이터 파싱 및 검증
 * 2. 데이터가 유효하지 않은 경우 검증 에러 반환
 * 3. 이메일/비밀번호로 Supabase에 로그인 시도
 * 4. 로그인 실패 시 인증 에러 반환
 * 5. 성공 시 인증 쿠키와 함께 홈 페이지로 리다이렉트
 *
 * @param request - 폼 제출 요청
 * @returns 검증 에러, 인증 에러 또는 성공 시 리다이렉트
 */
export async function action({ request }: Route.ActionArgs) {
  // 요청에서 폼 데이터 파싱
  const formData = await request.formData();
  const {
    data: validData,
    success,
    error,
  } = loginSchema.safeParse(Object.fromEntries(formData));

  // 폼 데이터가 유효하지 않은 경우 검증 에러 반환
  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }

  // 인증을 위한 요청 쿠키와 함께 Supabase 클라이언트 생성
  const [client, headers] = makeServerClient(request);

  // 이메일과 비밀번호로 로그인 시도
  const { error: signInError } = await client.auth.signInWithPassword({
    ...validData,
  });

  // 인증 실패 시 에러 반환
  if (signInError) {
    return data({ error: signInError.message }, { status: 400 });
  }

  // 헤더에 인증 쿠키와 함께 홈 페이지로 리다이렉트
  return redirect("/", { headers });
}

/**
 * 로그인 컴포넌트
 *
 * 이 컴포넌트는 로그인 폼을 렌더링하고 사용자 상호작용을 처리합니다.
 * 다음을 포함합니다:
 * - 검증이 포함된 이메일 및 비밀번호 입력 필드
 * - 폼 검증 및 인증 에러에 대한 에러 표시
 * - 비밀번호 재설정 링크
 * - 이메일 인증 재전송 기능
 * - 소셜 로그인 옵션
 * - 새 사용자를 위한 회원가입 링크
 *
 * @param actionData - 에러를 포함하는 폼 액션에서 반환된 데이터
 */
export default function Login({ actionData }: Route.ComponentProps) {
  // 폼 데이터에 액세스하기 위한 폼 요소 참조
  const formRef = useRef<HTMLFormElement>(null);

  // 이메일 인증 재전송 요청을 제출하기 위한 fetcher
  const fetcher = useFetcher();

  /**
   * 이메일 인증 재전송을 위한 핸들러
   *
   * 사용자가 인증되지 않은 이메일로 로그인을 시도할 때,
   * 인증 이메일을 재전송하기 위해 클릭할 수 있습니다. 이 함수는:
   * 1. 기본 버튼 동작 방지
   * 2. 현재 폼 데이터 가져오기 (이메일만)
   * 3. 재전송 엔드포인트에 제출
   */
  const onResendClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.delete("password"); // 인증 재전송에는 이메일만 필요합니다
    fetcher.submit(formData, {
      method: "post",
      action: "/auth/api/resend",
    });
  };
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">
            Sign into your account
          </CardTitle>
          <CardDescription className="text-base">
            Please enter your details
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form
            className="flex w-full flex-col gap-5"
            method="post"
            ref={formRef}
          >
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="email"
                className="flex flex-col items-start gap-1"
              >
                Email
              </Label>
              <Input
                id="email"
                name="email"
                required
                type="email"
                placeholder="이메일을 입력해주세요."
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.email ? (
                <FormErrors errors={actionData.fieldErrors.email} />
              ) : null}
            </div>
            <div className="flex flex-col items-start space-y-2">
              <div className="flex w-full items-center justify-between">
                <Label
                  htmlFor="password"
                  className="flex flex-col items-start gap-1"
                >
                  Password
                </Label>
                <Link
                  to="/auth/forgot-password/reset"
                  className="text-muted-foreground text-underline hover:text-foreground self-end text-sm underline transition-colors"
                  tabIndex={-1}
                  viewTransition
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                required
                type="password"
                placeholder="Enter your password"
              />

              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.password ? (
                <FormErrors errors={actionData.fieldErrors.password} />
              ) : null}
            </div>
            <FormButton label="Log in" className="w-full" />
            {actionData && "error" in actionData ? (
              actionData.error === "Email not confirmed" ? (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Email not confirmed</AlertTitle>
                  <AlertDescription className="flex flex-col items-start gap-2">
                    Before signing in, please verify your email.
                    <Button
                      variant="outline"
                      className="text-foreground flex items-center justify-between gap-2"
                      onClick={onResendClick}
                    >
                      Resend confirmation email
                      {fetcher.state === "submitting" ? (
                        <Loader2Icon
                          data-testid="resend-confirmation-email-spinner"
                          className="size-4 animate-spin"
                        />
                      ) : null}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <FormErrors errors={[actionData.error]} />
              )
            ) : null}
          </Form>
          <SignInButtons />
        </CardContent>
      </Card>
      <div className="flex flex-col items-center justify-center text-sm">
        <p className="text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/join"
            viewTransition
            data-testid="form-signup-link"
            className="text-muted-foreground hover:text-foreground text-underline underline transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

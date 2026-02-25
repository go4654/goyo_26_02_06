/**
 * 로그인 화면 컴포넌트
 *
 * 이 컴포넌트는 이메일/비밀번호 로그인, 소셜 인증 제공자를 통한 사용자 인증을 처리하고
 * 비밀번호 재설정 및 이메일 인증 옵션을 제공합니다. 폼 검증, 에러 처리 및
 * Supabase 인증 통합을 보여줍니다.
 */
import type { Route } from "./+types/login";

import { AlertCircle, CheckCircle2Icon, Loader2Icon } from "lucide-react";
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
import { checkUserBlocked, touchLastActiveAt } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import FormErrors from "../../../core/components/form-error";
import { SignInButtons } from "../components/auth-login-buttons";

/** Supabase/인증 서버에서 오는 영문 에러 메시지를 한글로 매핑 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Email not confirmed": "이메일 인증이 필요합니다.",
  "Invalid login credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "Too many requests": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  "User not found": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "Invalid email or password": "이메일 또는 비밀번호가 올바르지 않습니다.",
};

function getAuthErrorMessage(enMessage: string): string {
  return AUTH_ERROR_MESSAGES[enMessage] ?? enMessage;
}

/**
 * 로그인 페이지의 메타 함수
 *
 * 환경 변수에서 애플리케이션 이름을 사용하여 페이지 제목 설정
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `로그인 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * 로그인 페이지 로더
 * 회원가입 후 리다이렉트된 경우(registered=1) signupSuccess 플래그 반환
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const signupSuccess = url.searchParams.get("registered") === "1";
  const passwordUpdated = url.searchParams.get("passwordUpdated") === "1";
  return { signupSuccess, passwordUpdated };
}

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
  email: z.string().email({ message: "유효한 이메일 주소를 입력해주세요." }),
  password: z.string().min(8, { message: "비밀번호는 8자 이상이어야 합니다." }),
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

  // 보안: 차단된 유저는 차단 안내 페이지로 리다이렉트
  const { isBlocked, blockedReason } = await checkUserBlocked(client);
  if (isBlocked) {
    return redirect(
      `/blocked?reason=${encodeURIComponent(blockedReason || "")}`,
      { headers },
    );
  }

  // 최근 활동일 갱신 (로그인 시점)
  await touchLastActiveAt(client);

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
 * @param loaderData - 회원가입 성공 여부(signupSuccess) 등 로더 데이터
 */
export default function Login({
  actionData,
  loaderData,
}: Route.ComponentProps) {
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
    <div className="flex flex-col items-center justify-center gap-4 px-4 pt-4 pb-10 xl:py-20">
      <Card className="w-full max-w-md py-8">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">LOGIN</CardTitle>
          {/* <CardDescription className="text-base">
            Please enter your details
          </CardDescription> */}
        </CardHeader>

        {/* 로그인 폼 */}
        <CardContent className="grid gap-4">
          {/* 회원가입 성공 알림 (join에서 리다이렉트된 경우) */}
          {loaderData?.signupSuccess ? (
            <Alert className="bg-green-600/20 text-green-700 dark:bg-green-950/20 dark:text-green-600">
              <CheckCircle2Icon
                className="size-4"
                color="oklch(0.627 0.194 149.214)"
              />
              <AlertTitle>계정이 생성되었습니다!</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-600">
                이메일 인증 후 로그인할 수 있습니다.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* 비밀번호 변경 성공 알림 (비밀번호 재설정 후 리다이렉트된 경우) */}
          {loaderData?.passwordUpdated ? (
            <Alert className="bg-green-600/20 text-green-700 dark:bg-green-950/20 dark:text-green-600">
              <CheckCircle2Icon
                className="size-4"
                color="oklch(0.627 0.194 149.214)"
              />
              <AlertTitle>비밀번호가 변경되었습니다.</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-600">
                새 비밀번호로 다시 로그인해주세요.
              </AlertDescription>
            </Alert>
          ) : null}

          <Form
            className="flex w-full flex-col gap-8"
            method="post"
            ref={formRef}
          >
            {/* 이메일 입력 필드 */}
            <div className="flex flex-col items-start space-y-3">
              <Label
                htmlFor="email"
                className="flex flex-col items-start gap-1"
              >
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
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.email ? (
                <FormErrors errors={actionData.fieldErrors.email} />
              ) : null}
            </div>

            {/* 비밀번호 입력 필드 */}
            <div className="flex flex-col items-start space-y-3">
              <div className="flex w-full items-center justify-between">
                <Label
                  htmlFor="password"
                  className="flex flex-col items-start gap-1"
                >
                  비밀번호
                </Label>

                <Link
                  to="/auth/forgot-password/reset"
                  className="text-muted-foreground text-underline hover:text-foreground self-end text-sm underline transition-colors"
                  tabIndex={-1}
                  viewTransition
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              {/* 비밀번호 입력 필드 */}
              <Input
                id="password"
                name="password"
                required
                type="password"
                placeholder="비밀번호를 입력해주세요."
                className="h-12 rounded-2xl placeholder:text-sm"
              />

              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors.password ? (
                <FormErrors errors={actionData.fieldErrors.password} />
              ) : null}
            </div>

            {/* 로그인 버튼 */}
            <FormButton
              label="로그인"
              className="h-12 w-full cursor-pointer rounded-2xl text-base"
            />

            {/* 에러 메시지 (서버는 영문 반환, 표시는 한글로 변환) */}
            {actionData && "error" in actionData && actionData.error ? (
              actionData.error === "Email not confirmed" ? (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>이메일 인증이 필요합니다.</AlertTitle>
                  <AlertDescription className="flex flex-col items-start gap-2">
                    로그인 전, 이메일 인증을 해주세요.
                    <Button
                      variant="outline"
                      className="text-foreground flex items-center justify-between gap-2"
                      onClick={onResendClick}
                    >
                      인증 이메일 재전송
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
                <FormErrors errors={[getAuthErrorMessage(actionData.error)]} />
              )
            ) : null}
          </Form>

          {/* 소셜 로그인 버튼 */}
          <SignInButtons />
        </CardContent>

        {/* 회원가입 링크 */}
        <div className="flex flex-col items-center justify-center text-sm">
          <p className="text-text-3">
            아직 계정이 없으신가요?{" "}
            <Link
              to="/join"
              viewTransition
              data-testid="form-signup-link"
              className="hover:text-primary text-underline font-semibold text-white transition-colors"
            >
              회원가입
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

/**
 * 사용자 등록 화면 컴포넌트
 *
 * 이 컴포넌트는 다음을 포함하여 새 사용자 등록을 처리합니다:
 * - 이메일 및 비밀번호 등록
 * - 모든 필드에 대한 폼 검증
 * - 서비스 약관 및 마케팅 동의 옵션
 * - 소셜 인증 제공자
 * - 이메일 인증 지침이 포함된 성공 확인
 *
 * 등록 흐름에는 검증, 중복 이메일 확인 및 Supabase 인증 통합이 포함됩니다.
 */
import type { Route } from "./+types/join";

import { CheckCircle2Icon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Form, Link, data } from "react-router";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/core/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import makeServerClient from "~/core/lib/supa-client.server";

import { SignUpButtons } from "../components/auth-login-buttons";
import { doesUserExist } from "../lib/queries.server";

/**
 * 등록 페이지의 메타 함수
 *
 * 환경 변수에서 애플리케이션 이름을 사용하여 페이지 제목 설정
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Create an account | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * 사용자 등록을 위한 폼 검증 스키마
 *
 * Zod를 사용하여 다음을 검증합니다:
 * - Name: 필수 필드
 * - Email: 유효한 이메일 형식이어야 함
 * - Password: 최소 8자 이상이어야 함
 * - Confirm Password: 비밀번호 필드와 일치해야 함
 * - Marketing: 마케팅 동의를 위한 불리언 (기본값: false)
 * - Terms: 약관 동의를 위한 불리언
 *
 * 스키마는 비밀번호가 일치하는지 확인하기 위한 사용자 정의 정제를 포함합니다
 */
const joinSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    marketing: z.coerce.boolean().default(false),
    terms: z.coerce.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

/**
 * 사용자 등록 폼 제출을 처리하는 서버 액션
 *
 * 이 함수는 등록 폼 데이터를 처리하고 새 사용자를 생성하려고 시도합니다.
 * 흐름은 다음과 같습니다:
 * 1. join 스키마를 사용하여 폼 데이터 파싱 및 검증
 * 2. 데이터가 유효하지 않은 경우 검증 에러 반환
 * 3. 서비스 약관 동의 확인
 * 4. 제공된 이메일을 가진 사용자가 이미 존재하는지 확인
 * 5. Supabase auth로 새 사용자 생성
 * 6. 성공 또는 에러 응답 반환
 *
 * @param request - 폼 제출 요청
 * @returns 검증 에러, 인증 에러 또는 성공 확인
 */
export async function action({ request }: Route.ActionArgs) {
  // 요청에서 폼 데이터 파싱
  const formData = await request.formData();
  const {
    data: validData,
    success,
    error,
  } = joinSchema.safeParse(Object.fromEntries(formData));

  // 폼 데이터가 유효하지 않은 경우 검증 에러 반환
  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }

  // 서비스 약관 동의 확인
  if (!validData.terms) {
    return data(
      { error: "You must agree to the terms of service" },
      { status: 400 },
    );
  }

  // 제공된 이메일을 가진 사용자가 이미 존재하는지 확인
  const userExists = await doesUserExist(validData.email);

  if (userExists) {
    return data(
      { error: "There is an account with this email already." },
      { status: 400 },
    );
  }

  // Supabase 클라이언트 생성 및 사용자 등록 시도
  const [client] = makeServerClient(request);
  const { error: signInError } = await client.auth.signUp({
    ...validData,
    options: {
      // Supabase auth에 추가 사용자 메타데이터 저장
      data: {
        name: validData.name,
        display_name: validData.name,
        marketing_consent: validData.marketing,
      },
    },
  });

  // 사용자 생성 실패 시 에러 반환
  if (signInError) {
    return data({ error: signInError.message }, { status: 400 });
  }

  // 성공 응답 반환
  return {
    success: true,
  };
}

/**
 * 등록 컴포넌트
 *
 * 이 컴포넌트는 등록 폼을 렌더링하고 사용자 상호작용을 처리합니다.
 * 다음을 포함합니다:
 * - 개인 정보 필드 (이름, 이메일)
 * - 확인이 포함된 비밀번호 생성
 * - 서비스 약관 및 마케팅 동의 체크박스
 * - 폼 검증 및 등록 에러에 대한 에러 표시
 * - 이메일 인증 지침이 포함된 성공 확인
 * - 소셜 등록 옵션
 * - 기존 사용자를 위한 로그인 링크
 *
 * @param actionData - 에러 또는 성공 상태를 포함하는 폼 액션에서 반환된 데이터
 */
export default function Join({ actionData }: Route.ComponentProps) {
  // 성공적인 제출 후 재설정을 위한 폼 요소 참조
  const formRef = useRef<HTMLFormElement>(null);
  
  // 등록이 성공하면 폼 재설정
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      formRef.current?.reset();
      formRef.current?.blur();
    }
  }, [actionData]);
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold" role="heading">
            Create an account
          </CardTitle>
          <CardDescription className="text-base">
            Enter your details to create an account
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
                Name
              </Label>
              <Input
                id="name"
                name="name"
                required
                type="text"
                placeholder="Nico"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.name ? (
                <FormErrors errors={actionData.fieldErrors.name} />
              ) : null}
            </div>
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
              actionData.fieldErrors?.email ? (
                <FormErrors errors={actionData.fieldErrors.email} />
              ) : null}
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="password"
                className="flex flex-col items-start gap-1"
              >
                Password
                <small className="text-muted-foreground">
                  Must be at least 8 characters.
                </small>
              </Label>
              <Input
                id="password"
                name="password"
                required
                type="password"
                placeholder="Enter your password"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.password ? (
                <FormErrors errors={actionData.fieldErrors.password} />
              ) : null}
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="flex flex-col items-start gap-1"
              >
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                required
                type="password"
                placeholder="Confirm your password"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.confirmPassword ? (
                <FormErrors errors={actionData.fieldErrors.confirmPassword} />
              ) : null}
            </div>
            <FormButton label="Create account" className="w-full" />
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors errors={[actionData.error]} />
            ) : null}

            <div className="flex items-center gap-2">
              <Checkbox id="marketing" name="marketing" />
              <Label htmlFor="marketing" className="text-muted-foreground">
                Sign up for marketing emails
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="terms" name="terms" checked />
              <Label htmlFor="terms" className="text-muted-foreground">
                <span>
                  I have read and agree to the{" "}
                  <Link
                    to="/legal/terms-of-service"
                    viewTransition
                    className="text-muted-foreground text-underline hover:text-foreground underline transition-colors"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/legal/privacy-policy"
                    viewTransition
                    className="text-muted-foreground hover:text-foreground text-underline underline transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </Label>
            </div>
            {actionData && "success" in actionData && actionData.success ? (
              <Alert className="bg-green-600/20 text-green-700 dark:bg-green-950/20 dark:text-green-600">
                <CheckCircle2Icon
                  className="size-4"
                  color="oklch(0.627 0.194 149.214)"
                />
                <AlertTitle>Account created!</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-600">
                  Before you can sign in, please verify your email. You can
                  close this tab.
                </AlertDescription>
              </Alert>
            ) : null}
          </Form>
          <SignUpButtons />
        </CardContent>
      </Card>
      <div className="flex flex-col items-center justify-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            viewTransition
            data-testid="form-signin-link"
            className="text-muted-foreground hover:text-foreground text-underline underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

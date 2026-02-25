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

import { useRef } from "react";
import { Form, Link, data, redirect } from "react-router";
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
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import makeServerClient from "~/core/lib/supa-client.server";
import { getSiteSettings } from "~/features/admin/screens/settings/queries";

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
      title: `회원가입 | ${import.meta.env.VITE_APP_NAME}`,
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
    name: z.string().min(1, { message: "이름을 입력해주세요." }),
    email: z.string().email({ message: "유효한 이메일 주소를 입력해주세요." }),
    password: z
      .string()
      .min(8, { message: "비밀번호는 8자 이상이어야 합니다." }),
    confirmPassword: z
      .string()
      .min(8, { message: "비밀번호는 8자 이상이어야 합니다." }),
    marketing: z.coerce.boolean().default(false),
    terms: z.coerce.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

/** 회원가입 관련 영문 에러 메시지를 한글로 매핑 */
const JOIN_ERROR_MESSAGES: Record<string, string> = {
  "You must agree to the terms of service": "서비스 약관에 동의해주세요.",
  "There is an account with this email already.":
    "이미 사용 중인 이메일입니다.",
  "User already registered": "이미 가입된 이메일입니다.",
  "Signup requires a valid password": "유효한 비밀번호를 입력해주세요.",
  "Password should be at least 6 characters":
    "비밀번호는 6자 이상이어야 합니다.",
};

function getJoinErrorMessage(enMessage: string): string {
  return JOIN_ERROR_MESSAGES[enMessage] ?? enMessage;
}

/**
 * 회원가입 페이지 로더
 * signupEnabled가 false면 홈으로 리다이렉트
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const settings = await getSiteSettings(client);
  if (settings.signup_enabled === false) {
    throw redirect("/", 302);
  }
  return {};
}

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
    return data({ error: "서비스 약관에 동의해주세요." }, { status: 400 });
  }

  // 제공된 이메일을 가진 사용자가 이미 존재하는지 확인
  const userExists = await doesUserExist(validData.email);

  if (userExists) {
    return data({ error: "이미 사용 중인 이메일입니다." }, { status: 400 });
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

  // 사용자 생성 실패 시 에러 반환 (한글 메시지로 변환하여 반환)
  if (signInError) {
    return data(
      { error: getJoinErrorMessage(signInError.message) },
      { status: 400 },
    );
  }

  // 회원가입 성공 시 로그인 페이지로 리다이렉트 (로그인 페이지에서 성공 알림 표시)
  return redirect("/login?registered=1");
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
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 pt-4 pb-20 xl:px-0">
      <Card className="w-full max-w-md py-8">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold" role="heading">
            회원가입
          </CardTitle>
          <CardDescription className="text-sm">
            계정을 생성하기 위해 이름과 이메일을 입력해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form
            className="flex w-full flex-col gap-5"
            method="post"
            ref={formRef}
          >
            {/* 이름 입력 필드 */}
            <div className="flex flex-col items-start space-y-3">
              <Label htmlFor="name" className="flex flex-col items-start gap-1">
                이름
              </Label>
              <Input
                id="name"
                name="name"
                required
                type="text"
                placeholder="이름을 입력해주세요."
                className="h-12 rounded-2xl placeholder:text-sm"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.name ? (
                <FormErrors errors={actionData.fieldErrors.name} />
              ) : null}
            </div>

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
              actionData.fieldErrors?.email ? (
                <FormErrors errors={actionData.fieldErrors.email} />
              ) : null}
            </div>

            {/* 비밀번호 입력 필드 */}
            <div className="flex flex-col items-start space-y-3">
              <Label
                htmlFor="password"
                className="flex flex-col items-start gap-1"
              >
                비밀번호
                <small className="text-muted-foreground">
                  최소 8자 이상 작성해주세요.
                </small>
              </Label>
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
              actionData.fieldErrors?.password ? (
                <FormErrors errors={actionData.fieldErrors.password} />
              ) : null}
            </div>

            {/* 비밀번호 확인 필드 */}
            <div className="flex flex-col items-start space-y-3">
              <Label
                htmlFor="confirmPassword"
                className="flex flex-col items-start gap-1"
              >
                비밀번호 확인
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                required
                type="password"
                placeholder="비밀번호를 확인해주세요."
                className="h-12 rounded-2xl placeholder:text-sm"
              />
              {actionData &&
              "fieldErrors" in actionData &&
              actionData.fieldErrors?.confirmPassword ? (
                <FormErrors errors={actionData.fieldErrors.confirmPassword} />
              ) : null}
            </div>

            {/* 회원가입 버튼 */}
            <FormButton
              label="회원가입"
              className="h-12 w-full cursor-pointer rounded-2xl text-base"
            />
            {actionData && "error" in actionData && actionData.error ? (
              <FormErrors
                errors={[getJoinErrorMessage(String(actionData.error))]}
              />
            ) : null}

            <div className="flex flex-col items-start space-y-3">
              {/* 마케팅 동의 체크박스 */}
              <div className="flex items-center gap-2">
                <Checkbox id="marketing" name="marketing" />
                <Label htmlFor="marketing" className="text-muted-foreground">
                  마케팅 이메일 수신 동의
                </Label>
              </div>

              {/* 서비스 약관 동의 체크박스 */}
              <div className="flex items-center gap-2">
                <Checkbox id="terms" name="terms" checked />
                <Label htmlFor="terms" className="text-muted-foreground">
                  <span>
                    <Link
                      to="/legal/terms-of-service"
                      viewTransition
                      className="text-muted-foreground text-underline hover:text-foreground underline transition-colors"
                    >
                      서비스 약관
                    </Link>{" "}
                    및{" "}
                    <Link
                      to="/legal/privacy-policy"
                      viewTransition
                      className="text-muted-foreground hover:text-foreground text-underline underline transition-colors"
                    >
                      개인정보 처리방침
                    </Link>
                    을 읽고 동의합니다.
                  </span>
                </Label>
              </div>
            </div>
          </Form>

          {/* 소셜 로그인 버튼 */}
          <SignUpButtons />
        </CardContent>

        {/* 로그인 링크 */}
        <div className="flex flex-col items-center justify-center text-sm">
          <p className="text-text-3">
            이미 계정이 있으신가요?{" "}
            <Link
              to="/login"
              viewTransition
              data-testid="form-signin-link"
              className="hover:text-primary text-underline font-semibold text-white transition-colors"
            >
              로그인
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

/**
 * 일회용 비밀번호(OTP) 인증 완료 화면
 *
 * 이 컴포넌트는 OTP 인증 흐름의 두 번째 단계를 처리합니다:
 * 사용자가 이메일로 받은 인증 코드를 입력할 수 있도록 합니다.
 *
 * OTP 흐름은 두 단계로 구성됩니다:
 * 1. 시작 화면: 사용자가 이메일을 입력하여 인증 코드를 받음
 * 2. 이 화면: 사용자가 받은 코드를 입력하여 인증
 *
 * 이 화면은 6자리 인증 코드를 입력할 때 더 나은 사용자 경험을 위해
 * 특수화된 OTP 입력 컴포넌트를 사용합니다.
 */
import type { Route } from "./+types/complete";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useRef } from "react";
import { Form, data, redirect, useSubmit } from "react-router";
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
import { InputOTPSeparator } from "~/core/components/ui/input-otp";
import { InputOTPGroup } from "~/core/components/ui/input-otp";
import { InputOTPSlot } from "~/core/components/ui/input-otp";
import { InputOTP } from "~/core/components/ui/input-otp";
import { checkUserBlocked, touchLastActiveAt } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * OTP 완료 페이지의 메타 함수
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
 * URL 매개변수를 검증하기 위한 스키마
 *
 * URL 쿼리 매개변수에 유효한 이메일이 제공되는지 확인합니다
 * 이 이메일은 OTP 시작 페이지에서 전달됩니다
 */
const paramsSchema = z.object({
  email: z.string().email(),
});

/**
 * OTP 완료 페이지의 로더 함수
 *
 * 이 함수는 URL의 이메일 매개변수를 검증하고 컴포넌트에서 사용할 수 있도록 합니다.
 * 이메일이 없거나 유효하지 않은 경우, 사용자는 OTP 시작 페이지로 리다이렉트됩니다.
 *
 * @param request - URL 매개변수가 포함된 들어오는 요청
 * @returns 검증된 이메일 또는 시작 페이지로 리다이렉트
 */
export function loader({ request }: Route.LoaderArgs) {
  // URL 쿼리 매개변수에서 이메일 추출 및 검증
  const url = new URL(request.url);
  const { success, data: validData } = paramsSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  
  // 이메일이 없거나 유효하지 않은 경우 시작 페이지로 리다이렉트
  if (!success) {
    return redirect("/auth/otp/start");
  }
  
  // 검증된 이메일을 컴포넌트에 반환
  return { email: validData.email };
}

/**
 * OTP 인증 폼 제출을 처리하는 서버 액션
 *
 * 이 함수는 폼 데이터를 처리하고 OTP 코드를 확인하려고 시도합니다.
 * 흐름은 다음과 같습니다:
 * 1. 스키마를 사용하여 이메일 및 코드 검증
 * 2. 데이터가 유효하지 않은 경우 검증 에러 반환
 * 3. Supabase auth로 OTP 코드 확인
 * 4. 인증 쿠키와 함께 홈 페이지로 리다이렉트 또는 에러 반환
 *
 * @param request - 폼 제출 요청
 * @returns 검증 에러, 인증 에러 또는 인증 쿠키와 함께 홈 페이지로 리다이렉트
 */
export async function action({ request }: Route.ActionArgs) {
  // OTP 인증 폼을 검증하기 위한 스키마
  const otpCompleteSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
  });

  // 폼 데이터 파싱 및 검증
  const formData = await request.formData();
  const { success, data: validData } = otpCompleteSchema.safeParse(
    Object.fromEntries(formData),
  );

  // 데이터가 유효하지 않은 경우 검증 에러 반환
  if (!success) {
    return data(
      { error: "Could not verify code. Please try again." },
      { status: 400 },
    );
  }

  // 인증 쿠키를 위한 응답 헤더와 함께 Supabase 클라이언트 생성
  const [client, headers] = makeServerClient(request);

  // Supabase로 OTP 코드 확인
  const { error } = await client.auth.verifyOtp({
    email: validData.email,
    token: validData.code,
    type: "email",
  });

  // 확인 실패 시 에러 반환
  if (error) {
    return data({ error: error.message }, { status: 400 });
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
  return redirect(`/`, { headers });
}

/**
 * OTP 인증 완료 컴포넌트
 *
 * 이 컴포넌트는 OTP 인증 코드를 입력하기 위한 폼을 렌더링합니다.
 * 다음을 포함합니다:
 * - 숨겨진 이메일 필드 (로더 데이터에서 미리 채워짐)
 * - 6자리 슬롯이 있는 특수화된 OTP 입력
 * - 모든 숫자가 입력되면 자동 제출
 * - 폴백으로 수동 제출 버튼
 * - 검증 및 인증 에러에 대한 에러 표시
 *
 * 컴포넌트는 인증 코드를 입력할 때 더 나은 UX를 위해 특수화된 InputOTP 컴포넌트를 사용하며,
 * 모든 숫자가 입력되면 자동 제출됩니다.
 *
 * @param loaderData - 이메일 주소를 포함하는 로더의 데이터
 * @param actionData - 에러를 포함하는 폼 액션에서 반환된 데이터
 */
export default function OtpComplete({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  // 제출을 위한 폼 요소 참조
  const formRef = useRef<HTMLFormElement>(null);
  
  // 프로그래밍 방식으로 폼을 제출하기 위한 훅
  const submit = useSubmit();
  
  // 모든 OTP 숫자가 입력되면 자동으로 폼을 제출하는 핸들러
  const handleComplete = () => {
    submit(formRef.current);
  };
  
  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-md">
        {/* 제목과 설명이 있는 카드 헤더 */}
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">Confirm code</CardTitle>
          <CardDescription className="text-center text-base">
            Enter the code we sent you.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* OTP 인증 폼 */}
          <Form
            className="flex w-full flex-col items-center gap-4"
            method="post"
            ref={formRef}
          >
            {/* 로더 데이터에서 미리 채워진 숨겨진 이메일 필드 */}
            <Input
              id="email"
              name="email"
              hidden
              required
              type="email"
              defaultValue={loaderData.email}
              placeholder="이메일을 입력해주세요."
            />

            {/* 6자리 슬롯이 있는 특수화된 OTP 입력 컴포넌트 */}
            <InputOTP
              name="code"
              required
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS} // 숫자만 허용
              onComplete={handleComplete} // 모든 숫자가 입력되면 자동 제출
            >
              {/* 첫 번째 3자리 그룹 */}
              <InputOTPGroup className="*:p-6 *:text-lg">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              {/* 두 번째 3자리 그룹 */}
              <InputOTPGroup className="*:p-6 *:text-lg">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {/* 폴백으로 수동 제출 버튼 */}
            <FormButton label="Submit" className="w-full" />
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

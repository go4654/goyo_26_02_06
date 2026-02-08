/**
 * CAPTCHA 통합 문의 양식 페이지
 *
 * 이 모듈은 HCaptcha와 Turnstile(Cloudflare)을 모두 사용하는 이중 CAPTCHA 보호 기능을 구현합니다.
 * 자동화된 제출로부터 보안을 강화하기 위해 여러 CAPTCHA 제공자를 통합하는 방법을 보여줍니다.
 *
 * 포함된 기능:
 * - 기본 연락처 정보 필드 (이름, 이메일, 메시지)
 * - Zod 스키마를 이용한 서버 사이드 유효성 검사
 * - HCaptcha 및 Turnstile을 이용한 CAPTCHA 검증
 * - Resend API를 통한 이메일 전송
 * - 폼 상태 관리 및 사용자 피드백 제공
 *
 * 이 구현은 실제 프로덕션 애플리케이션에서 견고한 폼 보호 및 유효성 검사를 구현하는 예시가 됩니다.
 */
import type { Route } from "./+types/contact-us";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useEffect, useRef, useState } from "react";
import { Form, data } from "react-router";
import Turnstile, { useTurnstile } from "react-turnstile";
import { toast } from "sonner";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import resendClient from "~/core/lib/resend-client.server";

/**
 * 페이지 메타데이터 설정을 위한 함수
 *
 * 환경 변수에서 애플리케이션 이름을 가져와 문의하기 페이지의 제목을 설정합니다.
 *
 * @returns 페이지를 위한 메타데이터 객체 배열
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `문의하기 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Cloudflare API를 통해 Turnstile CAPTCHA 토큰 검증
 *
 * 클라이언트 측 Turnstile 위젯에서 받은 토큰을 Cloudflare 검증 엔드포인트로 전송하여
 * 사용자가 CAPTCHA 챌린지를 성공적으로 완료했는지 확인합니다.
 *
 * 검증 프로세스:
 * 1. 토큰과 시크릿 키를 Cloudflare 검증 엔드포인트로 전송
 * 2. JSON 응답을 파싱하여 토큰 유효성 판단
 * 3. 성공 또는 실패 여부를 불리언(boolean)으로 반환
 * 4. 오류 발생 시 예외 처리를 하고 false를 반환
 *
 * @param token - 클라이언트 측 Turnstile 위젯에서 받은 토큰
 * @returns 토큰 유효 여부를 나타내는 불리언 값의 Promise
 */
async function isTurnstileTokenValid(token: string) {
  try {
    // Cloudflare 검증 엔드포인트
    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    // Cloudflare에 검증 요청 전송
    const result = await fetch(url, {
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 응답 파싱 및 성공 상태 반환
    const outcome = await result.json();
    return outcome.success;
  } catch (error) {
    // 실패 시 에러 로깅 후 false 반환
    console.error(error);
    return false;
  }
}

/**
 * HCaptcha API를 통해 HCaptcha 토큰 검증
 *
 * 클라이언트 측 HCaptcha 위젯에서 받은 토큰을 HCaptcha 검증 엔드포인트로 전송하여
 * 사용자가 CAPTCHA 챌린지를 성공적으로 완료했는지 확인합니다.
 *
 * 검증 프로세스:
 * 1. 토큰과 시크릿 키를 HCaptcha 검증 엔드포인트로 전송
 * 2. JSON 응답을 파싱하여 토큰 유효성 판단
 * 3. 성공 또는 실패 여부를 불리언(boolean)으로 반환
 * 4. 오류 발생 시 예외 처리를 하고 false를 반환
 *
 * @param token - 클라이언트 측 HCaptcha 위젯에서 받은 토큰
 * @returns 토큰 유효 여부를 나타내는 불리언 값의 Promise
 */
async function isHcaptchaTokenValid(token: string) {
  try {
    // HCaptcha 검증 엔드포인트
    const url = "https://api.hcaptcha.com/siteverify";

    // HCaptcha에 검증 요청 전송
    // 참고: HCaptcha는 Turnstile과 달리 form-urlencoded 형식을 요구함
    const result = await fetch(url, {
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY!,
        response: token,
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // 응답 파싱 및 성공 상태 반환
    const outcome = await result.json();
    return outcome.success;
  } catch (error) {
    // 실패 시 에러 로깅 후 false 반환
    console.error(error);
    return false;
  }
}

/**
 * 문의 양식 제출을 위한 유효성 검사 스키마
 *
 * 문의 양식에 필요한 필드와 유효성 검사 규칙을 정의합니다:
 * - name: 필수 항목, 최소 1자 이상
 * - email: 필수 항목, 유효한 이메일 형식
 * - message: 필수 항목, 최소 1자 이상
 * - hcaptcha: 필수 항목, 유효한 HCaptcha 토큰 포함
 * - turnstile: 필수 항목, 유효한 Turnstile 토큰 포함
 *
 * 이 스키마는 폼 데이터를 처리하기 전 Zod의 safeParse 메서드와 함께 사용됩니다.
 */
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  hcaptcha: z.string().min(1),
  turnstile: z.string().min(1),
});

/**
 * 문의 양식 제출 처리를 위한 액션 핸들러
 *
 * 이 함수는 문의 페이지의 폼 제출을 처리합니다. 다음 단계를 따릅니다:
 * 1. 요청에서 폼 데이터를 추출하고 Zod 스키마를 사용하여 유효성 검사
 * 2. 각 서비스의 API를 통해 두 CAPTCHA 토큰을 검증
 * 3. 관리자 이메일로 연락처 정보를 전송
 * 4. 적절한 성공 또는 오류 응답을 반환
 *
 * 보안 고려 사항:
 * - 잘못된 데이터를 방지하기 위해 모든 폼 필드 유효성 검사
 * - 스팸 및 자동 제출 방지를 위해 CAPTCHA 토큰 검증
 * - 클라이언트 측 우회를 방지하기 위해 서버 측 유효성 검사 사용
 * - 적절한 상태 코드로 에러를 우아하게 처리
 *
 * @param request - 폼 데이터가 포함된 들어오는 HTTP 요청
 * @returns 성공 또는 실패 상세 정보가 포함된 JSON 응답
 */
export async function action({ request }: Route.ActionArgs) {
  // 요청에서 폼 데이터 추출
  const formData = await request.formData();

  // Zod 스키마를 사용하여 폼 데이터 유효성 검사
  const result = schema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    // 데이터가 유효하지 않은 경우 유효성 검사 에러 반환
    return data(
      { fieldErrors: result.error.flatten().fieldErrors, success: false },
      { status: 400 },
    );
  }

  // 검증된 데이터 추출
  const { name, email, message, hcaptcha, turnstile } = result.data;

  // 두 CAPTCHA 토큰을 병렬로 검증
  const [validTurnstile, validHcaptcha] = await Promise.all([
    isTurnstileTokenValid(turnstile),
    isHcaptchaTokenValid(hcaptcha),
  ]);

  // CAPTCHA 검증 중 하나라도 실패하면 에러 반환
  if (!validTurnstile || !validHcaptcha) {
    return data(
      {
        errors: {
          hcaptcha: !validHcaptcha
            ? ["캡차 인증에 실패했습니다. 다시 시도해주세요."]
            : [],
          turnstile: !validTurnstile
            ? ["캡차 인증에 실패했습니다. 다시 시도해주세요."]
            : [],
        },
        success: false,
      },
      { status: 400 },
    );
  }

  // 관리자에게 문의 정보가 포함된 이메일 전송
  const { error } = await resendClient.emails.send({
    from: "Goyo <hello@goyo.com>",
    to: [process.env.ADMIN_EMAIL!],
    subject: "Goyo에서 새로운 문의가 도착했습니다",
    html: `
      <p><b>이름:</b> ${name}</p>
      <p><b>이메일:</b> ${email}</p>
      <p><b>메시지:</b> ${message}</p>
    `,
  });

  // 이메일 전송 오류 처리
  if (error) {
    return data({ error, success: false }, { status: 500 });
  }

  // 성공 응답 반환
  return {
    success: true,
    error: null,
  };
}

/**
 * 문의하기(Contact Us) 폼 컴포넌트
 * * 이중 CAPTCHA 보호 기능이 포함된 문의 양식을 렌더링합니다.
 * 폼 상태, CAPTCHA 토큰을 관리하며 폼 제출 결과에 따른 사용자 피드백을 제공합니다.
 * * @param actionData - 폼 제출 후 액션 함수에서 반환된 데이터
 */
export default function ContactUs({ actionData }: Route.ComponentProps) {
  // 두 제공자로부터 받은 CAPTCHA 토큰 저장 상태
  const [hcaptchaToken, setHcaptchaToken] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  // CAPTCHA 위젯 렌더링 시점을 제어하는 상태 (SSR 이슈 방지용)
  const [renderCaptchas, setRenderCaptchas] = useState<boolean>(false);

  // CAPTCHA 위젯 및 폼과의 상호작용을 위한 Ref
  const hcaptchaRef = useRef<HCaptcha>(null); // 초기화를 위한 HCaptcha 위젯 참조
  const turnstile = useTurnstile(); // Turnstile 위젯 상호작용을 위한 훅
  const formRef = useRef<HTMLFormElement>(null); // 폼 엘리먼트 참조

  /**
   * 폼 제출 결과를 처리하는 이펙트
   * * actionData가 변경될 때마다(폼 제출 후) 실행됩니다.
   * 주요 작업:
   * 1. 두 CAPTCHA 위젯 초기화
   * 2. CAPTCHA 토큰 상태 초기화
   * 3. 성공 또는 에러 메시지 표시
   * 4. 성공적인 제출 시 폼 리셋
   */
  useEffect(() => {
    if (!actionData) return;

    // 두 CAPTCHA 위젯과 토큰 상태 초기화
    turnstile.reset();
    hcaptchaRef.current?.resetCaptcha();
    setHcaptchaToken("");
    setTurnstileToken("");

    // 성공적인 제출 처리
    if (actionData?.success) {
      // 성공 메시지 표시
      toast.success("이메일이 성공적으로 전송되었습니다.");

      // 폼 리셋 및 입력 필드 포커스 해제
      formRef.current?.reset();
      formRef.current?.querySelectorAll("input").forEach((input) => {
        input.blur();
      });
    }
    // 제출 중 에러 처리
    else if ("error" in actionData && actionData.error) {
      toast.error(actionData.error.message);
    }
  }, [actionData]);

  /**
   * CAPTCHA 위젯 지연 렌더링을 위한 이펙트
   * * 컴포넌트 마운트 시 한 번 실행되어 CAPTCHA 렌더링을 활성화합니다.
   * 지연 렌더링을 통해 서드파티 CAPTCHA 위젯에서 발생할 수 있는
   * 하이드레이션(Hydration) 불일치 및 SSR 관련 이슈를 방지합니다.
   */
  useEffect(() => {
    setRenderCaptchas(true);
  }, []);
  /**
   * 이중 CAPTCHA 보호 기능이 있는 문의 폼 렌더링
   * * 렌더링 항목:
   * 1. 제목 및 설명을 포함한 헤더 섹션
   * 2. 이름, 이메일, 메시지 필드가 포함된 폼
   * 3. 두 개의 CAPTCHA 위젯 (HCaptcha 및 Turnstile)
   * 4. 두 CAPTCHA가 모두 인증될 때까지 비활성화되는 제출 버튼
   * 5. 필드 유효성 검사 및 CAPTCHA 검증에 대한 에러 메시지
   */
  return (
    <div className="flex flex-col items-center gap-20">
      {/* 헤더 섹션 */}
      <div>
        <h1 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
          문의하기
        </h1>
        <p className="text-muted-foreground mt-2 text-center font-medium md:text-lg">
          HCaptcha와 Turnstile 캡차를 시연하기 위한 페이지입니다.
        </p>
      </div>

      {/* 문의 양식 */}
      <Form
        method="post"
        ref={formRef}
        className="flex w-full max-w-2xl flex-col gap-5"
      >
        {/* 이름 필드 */}
        <div className="flex flex-col items-start space-y-2">
          <Label htmlFor="name" className="flex flex-col items-start gap-1">
            이름
          </Label>
          <Input
            id="name"
            name="name"
            required
            type="text"
            placeholder="이름을 입력해주세요"
          />
          {/* 이름 필드 유효성 검사 에러 표시 */}
          {actionData &&
          "fieldErrors" in actionData &&
          actionData.fieldErrors?.name ? (
            <FormErrors errors={actionData.fieldErrors.name} />
          ) : null}
        </div>

        {/* 이메일 필드 */}
        <div className="flex flex-col items-start space-y-2">
          <Label htmlFor="email" className="flex flex-col items-start gap-1">
            이메일
          </Label>
          <Input
            id="email"
            name="email"
            required
            type="email"
            placeholder="이메일을 입력해주세요"
          />
          {/* 이메일 필드 유효성 검사 에러 표시 */}
          {actionData &&
          "fieldErrors" in actionData &&
          actionData.fieldErrors?.email ? (
            <FormErrors errors={actionData.fieldErrors.email} />
          ) : null}
        </div>

        {/* 메시지 필드 */}
        <div className="flex flex-col items-start space-y-2">
          <Label htmlFor="message" className="flex flex-col items-start gap-1">
            메시지
          </Label>
          <Textarea
            id="message"
            name="message"
            required
            placeholder="메시지를 입력해주세요"
            className="h-32 resize-none"
          />
          {/* 메시지 필드 유효성 검사 에러 표시 */}
          {actionData &&
          "fieldErrors" in actionData &&
          actionData.fieldErrors?.message ? (
            <FormErrors errors={actionData.fieldErrors.message} />
          ) : null}
        </div>

        {/* CAPTCHA 토큰을 위한 숨겨진 필드 */}
        <input type="hidden" name="hcaptcha" value={hcaptchaToken} required />
        <input type="hidden" name="turnstile" value={turnstileToken} required />

        {/* CAPTCHA 위젯 - SSR 이슈 방지를 위해 초기 마운트 후에만 렌더링 */}
        {renderCaptchas ? (
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row md:gap-0">
            {/* HCaptcha 위젯 */}
            <div>
              <HCaptcha
                sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
                onVerify={(token) => {
                  setHcaptchaToken(token);
                }}
                ref={hcaptchaRef}
              />
              {/* HCaptcha 검증 에러 표시 */}
              {actionData &&
              "errors" in actionData &&
              actionData.errors?.hcaptcha ? (
                <FormErrors
                  key="hcaptcha"
                  errors={actionData.errors.hcaptcha}
                />
              ) : null}
            </div>

            {/* Turnstile 위젯 */}
            <div>
              <Turnstile
                sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onVerify={(token) => {
                  setTurnstileToken(token);
                }}
              />
              {/* Turnstile 검증 에러 표시 */}
              {actionData &&
              "errors" in actionData &&
              actionData.errors?.turnstile ? (
                <FormErrors
                  key="turnstile"
                  errors={actionData.errors.turnstile}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {/* 이중 CAPTCHA 구현에 대한 안내 문구 */}
        <span className="text-center text-sm text-amber-500">
          참고: 이 페이지는 데모용이며, 실제 서비스에서는 두 개의 캡차를 동시에
          렌더링하지 않습니다.
          <br />
          HCaptcha와 Turnstile 중 하나를 선택하여 사용하시면 됩니다.
        </span>

        {/* 제출 버튼 - 두 CAPTCHA가 모두 검증될 때까지 비활성화 */}
        <FormButton
          type="submit"
          className="w-full"
          disabled={!hcaptchaToken || !turnstileToken}
          label="전송하기"
        />
      </Form>
    </div>
  );
}

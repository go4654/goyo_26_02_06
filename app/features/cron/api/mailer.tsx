/**
 * 이메일 큐 처리 API 엔드포인트
 *
 * 이 파일은 Postgres 메시지 큐(PGMQ)의 이메일을 처리하는
 * 크론 기반 API 엔드포인트를 구현합니다.
 * 예약된 작업에서 호출되어 비동기적으로 이메일을 전송함으로써
 * 사용자 요청 처리와 이메일 전송을 분리해 성능과 안정성을 높입니다.
 *
 * 주요 기능:
 * - CRON_SECRET을 사용한 인증
 * - 큐에서 한 번에 하나의 이메일만 처리
 * - 다양한 이메일 템플릿 지원
 * - Sentry 연동을 통한 에러 추적
 * - Resend를 사용한 이메일 발송
 */
import type { Route } from "./+types/mailer";

import * as Sentry from "@sentry/node";
import { data } from "react-router";
import WelcomeEmail from "transactional-emails/emails/welcome";

import resendClient from "~/core/lib/resend-client.server";
import adminClient from "~/core/lib/supa-admin-client.server";

/**
 * 큐에 저장된 이메일 메시지를 나타내는 인터페이스
 *
 * @property to - 수신자 이메일 주소
 * @property data - 이메일 템플릿에 들어갈 동적 콘텐츠 키-값 쌍
 * @property template - 전송할 이메일 템플릿 식별자 (예: "welcome")
 */
interface EmailMessage {
  to: string;
  data: Record<string, string>;
  template: string;
}

/**
 * 이메일 큐를 처리하는 API 엔드포인트 action 핸들러
 *
 * 이 함수는 크론 잡에 의해 트리거되며, 한 번에 하나의 이메일을 큐에서 가져와 처리합니다.
 * 동작 흐름:
 * 1. CRON_SECRET으로 요청 인증
 * 2. PGMQ 큐에서 메시지 pop
 * 3. 템플릿 종류에 따라 메시지 처리
 * 4. Resend로 이메일 전송
 * 5. Sentry로 에러 추적
 *
 * 보안 사항:
 * - 유효한 CRON_SECRET이 필요
 * - POST 요청만 허용
 * - 권한이 높은 admin 클라이언트를 사용하지만 이 엔드포인트 안에 한정됨
 *
 * @param request - 크론 잡에서 들어온 HTTP 요청
 * @returns 상태 코드가 포함된 응답 (성공 시 200, 인증 실패 시 401)
 */
export async function action({ request }: Route.LoaderArgs) {
  // 보안 체크: POST 메서드와 올바른 시크릿인지 검증
  if (
    request.method !== "POST" ||
    request.headers.get("Authorization") !== process.env.CRON_SECRET
  ) {
    return data(null, { status: 401 });
  }

  // Postgres 메시지 큐(PGMQ)에서 메시지를 하나 꺼냄
  // 큐에 접근하기 위해 admin 클라이언트 사용이 필요함
  const { data: message, error } = await adminClient
    // @ts-expect-error - Supabase 클라이언트에 PGMQ 타입이 완전히 정의되어 있지 않음
    .schema("pgmq_public")
    .rpc("pop", {
      queue_name: "mailer", // Postgres에 정의된 큐 이름
    });

  // 큐에 접근하는 동안 발생한 에러를 로깅
  if (error) {
    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error)),
    );
  }

  // 큐에서 메시지를 가져온 경우에만 처리
  if (message) {
    // 메시지에서 이메일 상세 정보를 추출
    const {
      message: { to, data: emailData, template },
    } = message as { message: EmailMessage };

    // 템플릿 종류에 따라 분기 처리
    if (template === "welcome") {
      // Resend 클라이언트를 사용해 웰컴 이메일 전송
      const { error } = await resendClient.emails.send({
        // 이 발신 도메인이 Resend에서 허용된 도메인인지 확인 필요
        from: "Goyo <hello@goyo.com>",
        to: [to],
        subject: "Welcome to Goyo!",
        react: WelcomeEmail({ profile: JSON.stringify(emailData, null, 2) }),
      });

      // 이메일 발송 중 발생한 에러를 로깅
      if (error) {
        Sentry.captureException(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }
    // 추가 템플릿은 이 아래에 if/else로 계속 확장 가능
  }

  // 성공 응답 반환
  // 크론 잡이 실패로 간주되지 않도록, 내부 에러가 있더라도 200을 반환하고
  // 에러는 Sentry에서 모니터링 및 디버깅용으로 추적함
  return data(null, { status: 200 });
}

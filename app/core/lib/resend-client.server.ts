/**
 * Resend 이메일 클라이언트 모듈
 *
 * 이 모듈은 애플리케이션에서 트랜잭션 이메일(사용자 행동에 따른 자동 발송 메일)을
 * 보내기 위한 Resend 이메일 클라이언트를 생성하고 내보냅니다.
 * Resend는 추적, 템플릿, 분석 기능을 제공하며 신뢰성 있는 이메일 전송을 지원하는
 * 현대적인 이메일 API 서비스입니다.
 *
 * 이 클라이언트는 RESEND_API_KEY 환경 변수로 설정되며, 애플리케이션 전반에서
 * 다음과 같은 다양한 유형의 이메일을 보내는 데 사용될 수 있습니다:
 * - 인증을 위한 확인 이메일 (OTP 등)
 * - 비밀번호 재설정 이메일
 * - 웰컴(가입 환영) 이메일
 * - 알림 이메일
 * - 마케팅 이메일 (적절한 동의가 있는 경우)
 *
 * 이 모듈은 사용자가 이메일을 통해 중요한 메시지를 받을 수 있도록 하는
 * 애플리케이션 통신 시스템의 일부로 사용됩니다.
 */
import { Resend } from "resend";

/**
 * Resend 이메일 클라이언트 인스턴스
 *
 * 이 클라이언트는 환경 변수의 RESEND_API_KEY를 사용하여 초기화되며,
 * Resend API를 통해 이메일을 보낼 수 있는 메서드들을 제공합니다.
 *
 * @example
 * // 서버 함수에서의 사용 예시
 * await resendClient.emails.send({
 * from: 'onboarding@example.com',
 * to: 'user@example.com',
 * subject: '서비스 가입을 환영합니다',
 * html: '<p>가입해 주셔서 감사합니다!</p>',
 * });
 */
const resendClient = new Resend(process.env.RESEND_API_KEY);

export default resendClient;

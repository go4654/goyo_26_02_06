/**
 * 로케일 설정 API 엔드포인트
 *
 * 이 파일은 사용자의 언어 선호도를 변경하기 위한 API 엔드포인트를 구현합니다.
 * 로케일 검증, 쿠키 설정 및 i18next 국제화 시스템과의 통합을 처리합니다.
 *
 * 주요 기능:
 * - 지원되는 언어에 대한 로케일 검증
 * - 언어 선호도의 쿠키 기반 지속성
 * - i18next 국제화 시스템과의 통합
 * - Zod 스키마를 사용한 타입 안전 구현
 */

import { type LoaderFunctionArgs, data } from "react-router";
import { z } from "zod";

import { localeCookie } from "~/core/lib/i18next.server";
import i18n from "~/i18n";

/**
 * 로케일 매개변수를 위한 검증 스키마
 *
 * 이 스키마는 지원되는 언어만 로케일로 설정할 수 있도록 보장합니다.
 * 타입 안전한 열거형 검증을 생성하기 위해 i18next 설정의
 * 지원 언어 목록을 사용합니다.
 */
const localeSchema = z.enum(i18n.supportedLngs);

/**
 * 로케일 변경 요청을 처리하는 액션 핸들러
 *
 * 이 함수는 완전한 로케일 변경 흐름을 처리합니다:
 * 1. URL 매개변수에서 요청된 로케일 추출
 * 2. 지원되는 언어에 대해 로케일 검증
 * 3. 새 로케일 선호도로 쿠키 설정
 * 4. 적절한 쿠키 헤더가 포함된 응답 반환
 *
 * 로케일 쿠키는 i18next 미들웨어에서 향후 요청에 대한 사용자의
 * 언어 선호도를 결정하는 데 사용되며, 애플리케이션 전반에 걸쳐
 * 일관된 현지화된 경험을 가능하게 합니다.
 *
 * @param request - 로케일 매개변수가 포함된 들어오는 HTTP 요청
 * @returns 새 로케일에 대한 Set-Cookie 헤더가 포함된 응답
 */
export async function action({ request }: LoaderFunctionArgs) {
  // URL 매개변수에서 로케일 추출
  const url = new URL(request.url);
  
  // 지원되는 언어에 대해 로케일 검증
  // 로케일이 지원되지 않으면 에러가 발생합니다
  const locale = localeSchema.parse(url.searchParams.get("locale"));
  
  // 새 로케일을 설정하기 위해 쿠키 헤더가 포함된 응답 반환
  return data(null, {
    headers: {
      "Set-Cookie": await localeCookie.serialize(locale),
    },
  });
}

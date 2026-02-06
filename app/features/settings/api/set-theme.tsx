/**
 * 테마 설정 API 엔드포인트
 *
 * 이 파일은 사용자의 테마 선호도(라이트 또는 다크 모드)를 변경하기 위한
 * API 엔드포인트를 구현합니다. 테마 관리 및 세션 기반 지속성을 위해
 * remix-themes 라이브러리를 활용합니다.
 *
 * 주요 기능:
 * - 테마 관리를 위한 remix-themes 통합
 * - 테마 선호도의 세션 기반 지속성
 * - 사용자 선택에 따른 자동 테마 전환
 * - 애플리케이션의 테마 시스템과의 원활한 통합
 *
 * 엔드포인트는 remix-themes의 createThemeAction 유틸리티를 사용하며,
 * 요청 처리, 테마 검증 및 세션 저장을 처리합니다.
 * 이를 통해 애플리케이션 전반에 걸쳐 일관된 테마 경험을 제공합니다.
 */

import { createThemeAction } from "remix-themes";

import { themeSessionResolver } from "~/core/lib/theme-session.server";

/**
 * 테마 변경 요청을 처리하는 액션 핸들러
 *
 * 이 액션은 remix-themes의 createThemeAction 유틸리티를 사용하여 생성되며,
 * 다음을 처리합니다:
 * 1. 요청에서 요청된 테마 추출
 * 2. 테마 검증 (라이트 또는 다크)
 * 3. 사용자 세션에 테마 선호도 저장
 * 4. 적절한 세션 쿠키가 포함된 응답 반환
 *
 * themeSessionResolver는 세션 처리 메커니즘을 제공하여
 * 테마 선호도가 요청 간에 지속되도록 보장합니다.
 */
export const action = createThemeAction(themeSessionResolver);

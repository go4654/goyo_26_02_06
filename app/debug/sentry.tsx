/**
 * Sentry 에러 모니터링 디버그 모듈
 *
 * Sentry 에러 모니터링 연동이 정상 동작하는지 확인하기 위한 테스트 페이지를 제공합니다.
 * 개발자나 관리자가 의도적으로 테스트 에러를 발생시키고, 해당 에러가 Sentry에
 * 정상적으로 포착·보고되는지 확인할 수 있습니다.
 *
 * 이 페이지에는 다음이 포함됩니다.
 * - 테스트 에러를 발생시키는 버튼이 있는 간단한 UI
 * - 폼 제출 시 에러를 던지는 액션 함수
 *
 * 실제 프로덕션 코드에서 에러 상황을 만들지 않고도, 개발 및 배포 이후에
 * 에러 모니터링이 정상 동작하는지 검증할 때 유용합니다.
 * 클라이언트부터 Sentry 대시보드까지 전체 에러 리포팅 파이프라인을 확인할 수 있습니다.
 */

import { Form } from "react-router";

import { Button } from "~/core/components/ui/button";

/**
 * 페이지 메타데이터 설정 함수
 *
 * Sentry 테스트 페이지의 제목을 설정합니다.
 * 애플리케이션 이름은 환경 변수에서 가져옵니다.
 */
export const meta = () => {
  return [
    {
      title: `Sentry Test | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * 의도적으로 에러를 던지는 액션 함수
 *
 * 폼이 제출되면 호출되며, 설명이 포함된 에러를 의도적으로 던져
 * Sentry가 서버 액션에서 발생한 에러를 올바르게 포착·보고하는지 테스트합니다.
 *
 * 에러는 Sentry 대시보드에 전체 스택 트레이스와 함께 표시되어야 합니다.
 */
export function action() {
  throw new Error("This is a test error, you should see it in Sentry");
}

/**
 * Sentry 테스트 컴포넌트
 *
 * Sentry 에러 모니터링 연동을 테스트하기 위한 간단한 인터페이스를 렌더링합니다.
 * 버튼 클릭 시 에러를 발생시키는 폼을 제출하여 `action` 함수가 호출되도록 합니다.
 *
 * React Router의 `Form` 컴포넌트를 사용해 폼 제출을 처리하며,
 * 에러가 발생하면 Sentry가 이를 포착해 보고해야 합니다.
 */
export default function TriggerError() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 px-5 py-10 md:px-10 md:py-20">
      <h1 className="text-2xl font-semibold">Sentry Test</h1>
      <p className="text-muted-foreground text-center">
        Test that the Sentry integration is working by triggering an error
        clicking the button below.
      </p>
      
      {/* Form that calls the action function which throws an error */}
      <Form method="post" className="mt-5">
        <Button>Trigger Error</Button>
      </Form>
    </div>
  );
}

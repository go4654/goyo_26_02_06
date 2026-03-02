/**
 * Google Analytics 디버그 모듈
 *
 * Google Analytics(GA4) 연동이 정상 동작하는지 확인하기 위한 테스트 페이지를 제공합니다.
 * 개발자나 관리자가 테스트 이벤트를 발생시키고, 해당 이벤트가 Google Analytics로
 * 정상 전송되는지 확인할 수 있습니다.
 *
 * 이 페이지에는 다음이 포함됩니다.
 * - 테스트 이벤트를 발생시키는 버튼이 있는 간단한 UI
 * - 이벤트 전송 성공 시 시각적 피드백
 * - 전송 중 로딩 상태 표시
 *
 * 실제 사용자 플로우를 수행하지 않고도, 개발 및 배포 이후에 분석 추적이
 * 정상적으로 동작하는지 검증할 때 유용합니다.
 */

import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import { Form, useNavigation } from "react-router";

import { Button } from "~/core/components/ui/button";
import trackEvent from "~/core/lib/analytics.client";

/**
 * 페이지 메타데이터 설정 함수
 *
 * Google Analytics 테스트 페이지의 제목을 설정합니다.
 * 애플리케이션 이름은 환경 변수에서 가져옵니다.
 */
export const meta = () => {
  return [
    {
      title: `Google Tag Test | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * 테스트 분석 이벤트를 트리거하는 클라이언트 액션 함수
 *
 * 폼이 제출되면 호출되며, `trackEvent` 유틸을 사용해
 * 타임스탬프가 포함된 테스트 이벤트를 Google Analytics로 전송합니다.
 * 전송 후에는 UI에서 확인 메시지를 표시하기 위한 성공 여부를 반환합니다.
 */
export async function clientAction() {
  // 타임스탬프를 포함한 테스트 이벤트를 Google Analytics로 전송
  trackEvent("test_event", {
    test: "test",
    time: new Date().toISOString(),
  });
  
  // 확인 메시지 표시에 사용할 성공 응답 반환
  return {
    success: true,
  };
}

interface TriggerEventProps {
  actionData?: {
    success?: boolean;
  } | null;
}

/**
 * Google Analytics 테스트 컴포넌트
 *
 * Google Analytics 연동을 테스트하기 위한 간단한 인터페이스를 렌더링합니다.
 * 버튼 클릭 시 테스트 이벤트를 발생시키고, 전송 중에는 로딩 스피너를,
 * 전송 후에는 성공 메시지를 표시합니다.
 *
 * React Router의 `Form`과 `useNavigation` 훅을 사용해 폼 제출과 상태를 관리합니다.
 */
export default function TriggerEvent({ actionData }: TriggerEventProps) {
  // 현재 네비게이션 상태를 가져와 로딩 인디케이터를 표시
  const { state } = useNavigation();
  
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 px-5 py-10 md:px-10 md:py-20">
      <h1 className="text-2xl font-semibold">Google Tag Test</h1>
      <p className="text-muted-foreground text-center">
        Test that the Google Tag integration is working by clicking the button
        below.
      </p>
      
      {/* Form for triggering the test event */}
      <Form method="post" className="mt-5 flex w-xs justify-center">
        <Button
          disabled={state === "submitting"}
          type="submit"
          className="w-1/2"
        >
          {state === "submitting" ? (
            <>
              <LoaderCircleIcon className="size-4 animate-spin" />
            </>
          ) : (
            "Trigger Event"
          )}
        </Button>
      </Form>
      
      {/* Success message shown after event is triggered */}
      {actionData?.success && (
        <p className="text-muted-foreground flex items-center gap-2">
          <CheckCircle2Icon className="size-4 text-green-600" /> Event triggered
          successfully
        </p>
      )}
    </div>
  );
}

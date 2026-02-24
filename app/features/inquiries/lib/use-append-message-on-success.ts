import { useEffect, useRef } from "react";

/**
 * fetcher 제출 성공 시, 서버가 돌려준 message를 "1회만" 처리하기 위한 공용 훅
 *
 * 왜 필요한가?
 * - react-router fetcher는 상태(state) 변화와 data 갱신 타이밍이 항상 동시에 보장되지 않습니다.
 * - 예: state가 먼저 idle로 바뀐 뒤 data가 들어오면, state만 의존하는 effect는 실행되지 않아
 *   "전송 후 즉시 append"가 누락될 수 있습니다.
 *
 * 이 훅은
 * - state(=idle) + success + messageId 변화를 함께 감지해서
 * - 메시지를 즉시 append하고
 * - 동일 메시지에 대해 effect가 중복 실행되는 것은 ref로 차단합니다.
 */
export function useAppendMessageOnSuccess<TMessage>({
  fetcherState,
  isSuccess,
  message,
  messageId,
  onSuccess,
}: {
  fetcherState: "idle" | "submitting" | "loading";
  isSuccess: boolean;
  message: TMessage | undefined;
  messageId: string | null | undefined;
  onSuccess: (message: TMessage) => void;
}) {
  const handledMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetcherState !== "idle") return;
    if (!isSuccess) return;
    if (!message || !messageId) return;

    // 중요: 동일한 메시지 id에 대해 중복 처리 방지
    if (handledMessageIdRef.current === messageId) return;
    handledMessageIdRef.current = messageId;

    onSuccess(message);
  }, [fetcherState, isSuccess, messageId, message, onSuccess]);
}


/**
 * 문의 채팅(유저/관리자 공통)에서 사용하는 최소 메시지 타입
 *
 * - 화면 렌더링/즉시 append/중복 제거에 필요한 필드만 포함
 * - DB 스키마(inquiry_messages) snake_case를 UI에서 camelCase로 변환한 형태
 */
export interface InquiryChatMessage {
  id: string;
  content: string;
  authorProfileId: string;
  authorRole: "user" | "admin";
  createdAt: string;
}

/** 메시지 전송 성공 응답 (유저/관리자 공통) */
export interface InquiryChatSendSuccess<TMessage extends InquiryChatMessage> {
  success: true;
  message: TMessage;
  /** 관리자 답변으로 pending → answered 변경 시에만 내려줌 */
  updatedStatus?: "answered" | null;
}

/** 실패 응답 */
export interface InquiryChatError {
  error: string;
}


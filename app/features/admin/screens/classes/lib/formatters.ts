import { DateTime } from "luxon";

/**
 * 숫자를 한국어 형식으로 포맷팅합니다.
 * 1000 이상일 경우 "1천", "1만" 등의 형식으로 표시합니다.
 *
 * @param num - 포맷팅할 숫자
 * @returns 포맷팅된 문자열 (예: "120", "1.2천", "1만", "12만")
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  if (num < 10000) {
    const thousands = num / 1000;
    // 소수점이 있으면 한 자리까지 표시, 없으면 정수로 표시
    return thousands % 1 === 0
      ? `${Math.floor(thousands)}천`
      : `${thousands.toFixed(1)}천`;
  }

  if (num < 100000) {
    const tenThousands = num / 10000;
    return tenThousands % 1 === 0
      ? `${Math.floor(tenThousands)}만`
      : `${tenThousands.toFixed(1)}만`;
  }

  if (num < 100000000) {
    const hundredThousands = num / 10000;
    return `${Math.floor(hundredThousands)}만`;
  }

  // 1억 이상
  const hundredMillions = num / 100000000;
  return hundredMillions % 1 === 0
    ? `${Math.floor(hundredMillions)}억`
    : `${hundredMillions.toFixed(1)}억`;
}

/**
 * ISO 날짜 문자열을 한국어 형식으로 포맷팅합니다.
 * luxon을 사용하여 "2026.02.10" 형식으로 변환합니다.
 *
 * @param isoString - ISO 형식의 날짜 문자열
 * @returns 포맷팅된 날짜 문자열 (예: "2026.02.10")
 */
export function formatDate(isoString: string): string {
  const date = DateTime.fromISO(isoString);
  if (!date.isValid) {
    return isoString; // 유효하지 않은 날짜인 경우 원본 반환
  }
  return date.toFormat("yyyy.MM.dd");
}

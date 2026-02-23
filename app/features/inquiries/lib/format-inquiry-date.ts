import { DateTime } from "luxon";

/** 목록용 날짜 포맷 YYYY.MM.DD (luxon 사용) */
export function formatInquiryDate(isoDate: string): string {
  const dt = DateTime.fromISO(isoDate, { zone: "utc" });
  return dt.isValid ? dt.toFormat("yyyy.MM.dd") : "";
}

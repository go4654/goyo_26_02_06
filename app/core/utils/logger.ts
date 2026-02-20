/**
 * 개발 환경(DEV) 전용 로거
 * NODE_ENV가 development/dev가 아니면 로그를 출력하지 않습니다.
 */

const isDev =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
};

/**
 * 개발 환경 전용 로거
 * 프로덕션에서는 아무것도 출력하지 않습니다.
 */

const isDevelopment =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

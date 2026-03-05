import type { Route } from "./+types/random-choice";

import { Loader2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "랜덤 선택 | GOYO" },
    {
      name: "description",
      content: "내용을 입력하면 무작위로 순서를 결정할 수 있습니다.",
    },
  ];
};

/** textarea에서 이름 목록 파싱 (빈 줄 제거, trim, 탭 제거) */
function parseNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, "").trim())
    .filter((line) => line.length > 0);
}

/** Fisher-Yates 셔플 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 셔플 애니메이션: 전체 섞는 시간(ms) */
const SHUFFLE_DURATION_MS = 4000;
/** 셔플 애니메이션: 순서가 바뀌는 간격(ms) */
const SHUFFLE_TICK_MS = 90;
/** 결과 카드가 순차 등장하는 간격(ms) - 값을 키우면 더 천천히 나타남 */
const STAGGER_DELAY_MS = 120;
/** 결과 카드 하나의 등장 애니메이션 길이(ms) */
const STAGGER_ANIMATION_DURATION_MS = 400;

export default function RandomChoice() {
  const [namesText, setNamesText] = useState("");
  const [resultOrder, setResultOrder] = useState<string[] | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<string[]>([]);
  const [showStagger, setShowStagger] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shuffleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const resultAreaRef = useRef<HTMLDivElement>(null);

  const names = parseNames(namesText);

  /** 컴포넌트 unmount 시 interval cleanup */
  useEffect(() => {
    return () => {
      if (shuffleIntervalRef.current) {
        clearInterval(shuffleIntervalRef.current);
      }
    };
  }, []);

  const runShuffleAnimation = useCallback(() => {
    if (isShuffling) return;

    if (names.length < 2) {
      setError("최소 2명 이상의 이름을 입력해 주세요.");
      return;
    }

    setError(null);
    setIsShuffling(true);
    setShowStagger(false);

    // 결과 영역으로 스크롤
    requestAnimationFrame(() => {
      resultAreaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    const start = Date.now();

    shuffleIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;

      if (elapsed >= SHUFFLE_DURATION_MS) {
        if (shuffleIntervalRef.current) {
          clearInterval(shuffleIntervalRef.current);
          shuffleIntervalRef.current = null;
        }

        const finalOrder = shuffleArray(names);

        setDisplayOrder(finalOrder);
        setResultOrder(finalOrder);
        setIsShuffling(false);
        setShowStagger(true);

        return;
      }

      setDisplayOrder(shuffleArray(names));
    }, SHUFFLE_TICK_MS);
  }, [names, isShuffling]);

  const handleReset = useCallback(() => {
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }

    setIsShuffling(false);
    setResultOrder(null);
    setDisplayOrder([]);
    setShowStagger(false);
    setError(null);
  }, []);

  return (
    <section className="mx-auto max-w-2xl py-6">
      {/* 제목 */}
      {/* <h2 className="text-h4 mb-8 font-semibold tracking-tight text-zinc-100">
        랜덤 발표자
      </h2> */}

      {/* 입력 영역 */}
      <div className="mb-8">
        <label
          htmlFor="names-input"
          className="mb-2 block text-sm font-medium text-zinc-400"
        >
          섞을 내용 (한 줄에 한 개)
        </label>

        <textarea
          id="names-input"
          value={namesText}
          onChange={(e) => setNamesText(e.target.value)}
          onFocus={() => setError(null)}
          placeholder={"예)\n김철수\n이영희\n박민수\n최지훈"}
          rows={6}
          disabled={isShuffling}
          className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      {/* 버튼 */}
      <div className="mb-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runShuffleAnimation}
          disabled={isShuffling || names.length < 2}
          className="bg-primary hover:bg-primary/90 cursor-pointer rounded-xl px-6 py-3 text-base font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          섞어서 결과 보기!
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isShuffling}
          className="border-text-2 text-text-2 hover:bg-text-2/10 flex cursor-pointer items-center gap-2 rounded-xl border bg-transparent px-6 py-3 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="size-4" /> 초기화
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="mb-6 text-sm font-medium text-amber-400" role="alert">
          {error}
        </p>
      )}

      {/* 셔플 중 메시지 */}
      {isShuffling && (
        <p className="mb-6 flex items-center gap-2 text-xl text-zinc-400">
          <Loader2 className="size-4 animate-spin" /> 섞는 중...
        </p>
      )}

      {/* 결과 영역 (섞어서 결과 보기 클릭 시 여기로 스크롤) */}
      <div
        ref={resultAreaRef}
        className="flex scroll-mt-6 flex-col items-center gap-4"
      >
        {isShuffling &&
          displayOrder.length > 0 &&
          displayOrder.map((name, index) => (
            <div
              key={`slot-${index}`}
              className="w-full max-w-md rounded-xl border border-zinc-200 bg-zinc-200 px-6 py-4 text-center text-2xl text-zinc-800 shadow-lg transition-all duration-75 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <span className="text-zinc-500 dark:text-zinc-400">
                {index + 1}.{" "}
              </span>
              {name}
            </div>
          ))}

        {!isShuffling && resultOrder && resultOrder.length > 0 && (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            {resultOrder.map((name, index) => (
              <div
                key={`result-${index}`}
                className="w-full rounded-xl border border-zinc-200 bg-white px-6 py-4 text-center text-2xl text-zinc-900 shadow-xl transition-all duration-300 ease-out dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                style={{
                  animation: showStagger
                    ? `staggerIn ${STAGGER_ANIMATION_DURATION_MS}ms ease-out forwards`
                    : "none",
                  opacity: showStagger ? 0 : 1,
                  animationDelay: showStagger
                    ? `${index * (STAGGER_DELAY_MS / 1000)}s`
                    : "0s",
                }}
              >
                <span className="text-zinc-500 dark:text-zinc-400">
                  {index + 1}.{" "}
                </span>
                {name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 스태거 등장 애니메이션 (STAGGER_ANIMATION_DURATION_MS 변수와 연동) */}
      <style>{`
        @keyframes staggerIn {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

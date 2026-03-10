import type { Route } from "./+types/wheel";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/** 라우트 로더 */
export function loader(_args: Route.LoaderArgs) {
  return {};
}

/** 라우트 액션 */
export function action(_args: Route.ActionArgs) {
  return {};
}

/** 라우트 메타 */
export const meta: Route.MetaFunction = () => {
  const title = "돌림판 랜덤 추첨 도구 | 고요 GOYO";
  const description =
    "항목을 추가하고 돌림판을 돌려 무작위로 당첨자·메뉴·아이디어를 뽑을 수 있는 랜덤 추첨 도구입니다.";

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
  ];
};

/** 돌림판 세그먼트 색상 팔레트 */
const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#f97316",
  "#14b8a6",
  "#a855f7",
  "#ec4899",
];

/** 항목이 없을 때 돌림판에 표시할 플레이스홀더 */
const PLACEHOLDER_OPTIONS = [
  "항목을 추가하세요",
  "Enter로 입력",
  "최소 2개",
  "최대 10개",
];

const MIN_ITEMS = 2;
const MAX_ITEMS = 10;
const CONFETTI_DURATION_MS = 2000;

/** react-custom-roulette용 data 배열 생성 */
function buildWheelData(
  labels: string[],
  colors: string[],
): { option: string; style: { backgroundColor: string; textColor: string } }[] {
  return labels.map((option, i) => ({
    option,
    style: {
      backgroundColor: colors[i % colors.length] ?? COLORS[0],
      textColor: "#ffffff",
    },
  }));
}

/** 로딩 중 플레이스홀더 (SSR/초기 로드 시) */
function WheelPlaceholder() {
  return (
    <section className="mx-auto max-w-4xl py-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-xs">
          <div className="border-text-2 bg-background/50 h-12 animate-pulse rounded-xl border" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-700" />
            <div className="flex flex-col gap-2">
              <div className="h-10 animate-pulse rounded-lg bg-zinc-800/50" />
              <div className="h-10 animate-pulse rounded-lg bg-zinc-800/50" />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center gap-6">
          <div className="bg-background/30 flex h-[280px] w-[280px] items-center justify-center rounded-full border border-zinc-700">
            <span className="text-text-2 text-sm">로딩 중...</span>
          </div>
          <div className="h-12 w-24 animate-pulse rounded-xl bg-zinc-700" />
        </div>
      </div>
    </section>
  );
}

/**
 * 돌림판 페이지.
 * react-custom-roulette, canvas-confetti는 브라우저 전용이므로
 * 클라이언트에서만 동적 로드해 SSR 시 "window is not defined" 방지.
 */
export default function SpinWheel() {
  const [clientReady, setClientReady] = useState(false);
  const [RouletteWheel, setRouletteWheel] = useState<React.ElementType | null>(
    null,
  );
  const confettiRef = useRef<((options?: object) => Promise<null>) | null>(
    null,
  );

  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [wheelKey, setWheelKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      import("react-custom-roulette"),
      import("canvas-confetti"),
    ]).then(([roulette, confettiModule]) => {
      setRouletteWheel(() => roulette.Wheel);
      confettiRef.current = confettiModule.default;
      setClientReady(true);
    });
  }, []);

  const labels = items.length >= MIN_ITEMS ? items : PLACEHOLDER_OPTIONS;
  const wheelData = buildWheelData(labels, COLORS);
  const canSpin = items.length >= MIN_ITEMS && !mustSpin;
  const safePrizeNumber = Math.min(
    prizeNumber,
    Math.max(0, wheelData.length - 1),
  );

  const addItem = useCallback(() => {
    const value = inputValue.trim();
    if (!value) return;
    if (items.length >= MAX_ITEMS) return;
    setItems((prev) => [...prev, value]);
    setInputValue("");
    setResult(null);
    inputRef.current?.focus();
  }, [inputValue, items.length]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!e.nativeEvent.isComposing) addItem();
      }
    },
    [addItem],
  );

  const handleSpin = useCallback(() => {
    if (!canSpin) return;
    const index = Math.floor(Math.random() * items.length);
    setPrizeNumber(index);
    setResult(null);
    setMustSpin(true);
  }, [canSpin, items.length]);

  const handleStopSpinning = useCallback(() => {
    setMustSpin(false);
    if (items.length > 0) {
      setResult(items[prizeNumber] ?? null);
      // 라이브러리 stop 애니메이션이 cubic-bezier overshoot으로 각도가 튐 → 리마운트로 최종 각도 고정
      setWheelKey((k) => k + 1);
      const end = Date.now() + CONFETTI_DURATION_MS;
      const confettiFn = confettiRef.current;
      if (confettiFn) {
        (function frame() {
          confettiFn({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: COLORS,
          });
          confettiFn({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: COLORS,
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        })();
      }
    }
  }, [items, prizeNumber]);

  if (!clientReady || !RouletteWheel) {
    return <WheelPlaceholder />;
  }

  return (
    <section className="mx-auto max-w-4xl py-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-xs">
          <label
            htmlFor="wheel-input"
            className="text-sm font-medium text-zinc-400"
          >
            항목 추가 (Enter)
          </label>
          <input
            ref={inputRef}
            id="wheel-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="이름 입력 후 Enter"
            disabled={mustSpin}
            maxLength={50}
            className="border-text-2 bg-background placeholder:text-text-2/60 w-full rounded-xl border px-4 py-3 text-base transition outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-500">
              {items.length} / {MAX_ITEMS} (최소 {MIN_ITEMS}개)
            </span>
            <ul className="flex flex-col gap-2">
              {items.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="border-text-2 flex items-center justify-between gap-2 rounded-lg border bg-zinc-100 px-3 py-2 dark:bg-zinc-800/50"
                >
                  <span className="text-text-1 min-w-0 truncate text-sm">
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={mustSpin}
                    className="text-zinc-500 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-white"
                    aria-label={`${item} 삭제`}
                  >
                    <X className="size-4 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center gap-6">
          {result && (
            <div
              role="status"
              aria-live="polite"
              className="animate-in fade-in zoom-in-95 flex flex-col items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-8 py-6 text-center shadow-lg duration-300"
            >
              <p className="text-sm font-medium tracking-wide text-indigo-300">
                🎉 선택된 항목
              </p>

              <p className="text-3xl font-bold tracking-tight">{result}</p>
            </div>
          )}
          <div className="relative flex justify-center">
            <RouletteWheel
              key={wheelKey}
              mustStartSpinning={mustSpin}
              prizeNumber={safePrizeNumber}
              data={wheelData}
              backgroundColors={COLORS}
              textColors={Array(wheelData.length).fill("#ffffff")}
              outerBorderColor="#334155"
              outerBorderWidth={4}
              radiusLineColor="#475569"
              radiusLineWidth={2}
              fontSize={14}
              textDistance={70}
              spinDuration={0.8}
              disableInitialAnimation
              startingOptionIndex={
                wheelKey > 0 && !mustSpin ? safePrizeNumber : -1
              }
              onStopSpinning={handleStopSpinning}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleSpin}
              disabled={!canSpin}
              className="bg-primary hover:bg-primary/90 cursor-pointer rounded-xl px-8 py-3 text-base font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:opacity-50"
            >
              돌리기
            </button>
            {/* <button
              type="button"
              onClick={handleSpin}
              disabled={!canSpin}
              className="border-text-2 text-text-2 hover:bg-text-2/10 cursor-pointer rounded-xl border px-6 py-3 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              한번 더 돌리기
            </button> */}
          </div>
        </div>
      </div>
    </section>
  );
}

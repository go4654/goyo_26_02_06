import type { ComponentPropsWithoutRef, FC, ReactNode } from "react";

import { MotionValue, motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { cn } from "~/core/lib/utils";

export interface TextRevealProps extends ComponentPropsWithoutRef<"div"> {
  children: string;
  progress: MotionValue<number>; // 부모의 스크롤 값을 받음
}

export const TextReveal: FC<TextRevealProps> = ({
  children,
  className,
  progress,
}) => {
  // 내부의 targetRef와 useScroll은 이제 필요 없습니다.
  const words = children.split(" ");

  return (
    <div className={cn("relative z-0", className)}>
      {/* 내부의 sticky와 h-[200vh]를 제거했습니다. */}
      <span
        className={
          "xl:text-h1 flex flex-wrap p-5 text-2xl font-bold text-black/20 md:p-8 md:text-3xl lg:p-10 lg:text-4xl dark:text-white/40"
        }
      >
        {words.map((word, i) => {
          const start = i / words.length;
          const end = start + 1 / words.length;
          return (
            <Word key={i} progress={progress} range={[start, end]}>
              {word}
            </Word>
          );
        })}
      </span>
    </div>
  );
};

interface WordProps {
  children: ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
}

const Word: FC<WordProps> = ({ children, progress, range }) => {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className="xl:lg-3 relative mx-1 lg:mx-1.5">
      <span className="absolute opacity-30">{children}</span>
      <motion.span
        style={{ opacity: opacity }}
        className={"text-black dark:text-white"}
      >
        {children}
      </motion.span>
    </span>
  );
};

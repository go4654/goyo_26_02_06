import { useScroll } from "motion/react";
import { useRef } from "react";

import { TextReveal } from "~/core/components/ui/text-reveal";

export default function LogEverythingText() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  return (
    <section ref={sectionRef} className="relative h-[450vh] w-full">
      {/* 2. 화면 상단에 고정될 컨테이너 (h-screen + sticky) */}
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* 3. 실제 텍스트가 드러나는 영역 */}
        <div className="mx-auto text-center md:w-[800px]">
          <TextReveal
            children="LOG EVERYTHING, CREATE ANYTHING. 기억은 한계가 있지만, 기록은 결과물이 됩니다."
            progress={scrollYProgress}
            className="text-h1 tracking-tighter"
          />
        </div>
      </div>
    </section>
  );
}

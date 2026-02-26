import { type Variants, motion, useReducedMotion } from "motion/react";

import { AuroraText } from "~/core/components/ui/aurora-text";
import { Particles } from "~/core/components/ui/particles";
import Container from "~/core/layouts/container";

import HomeMoreBtn from "../../components/home-more-btn";

export default function Section1() {
  const reduce = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };
  return (
    <section className="relative h-[80vh] w-full xl:h-screen">
      {/* 별 흩어진 효과 */}
      <div className="absolute top-0 left-0 hidden h-screen w-full overflow-hidden md:block">
        <Particles quantity={500} />
      </div>

      {/*왼쪽 하단 원형 그라데이션 */}
      <div className="absolute bottom-[100px] -left-[20%] h-[300px] w-[300px] rounded-full bg-[linear-gradient(to_left,#7C4DFF,#000)] opacity-30 blur-xl md:-left-[10%] md:h-[600px] md:w-[600px]"></div>

      {/* 오른쪽 상단 원형 그라데이션 */}
      <div className="absolute top-0 -right-[0%] h-[300px] w-[300px] rounded-full bg-[linear-gradient(to_left,#7C4DFF,#000)] opacity-20 blur-xl md:h-[600px] md:w-[600px]"></div>

      {/* 컨테이너 */}

      <motion.div
        variants={reduce ? undefined : containerVariants}
        initial={reduce ? undefined : "hidden"}
        animate="show"
        className="relative z-10 flex h-full w-full flex-col items-start justify-center px-5 xl:px-32"
      >
        <motion.h1
          variants={reduce ? undefined : itemVariants}
          className="font-roboto text-[80px] leading-[70px] font-bold tracking-[-0.02em] md:text-[200px] md:leading-[180px]"
        >
          Silent Growth <br />
          <AuroraText colors={["#7C4DFF", "#BB86FC", "#03DAC6"]} speed={2}>
            Partner.
          </AuroraText>
        </motion.h1>

        <motion.p
          variants={reduce ? undefined : itemVariants}
          className="text-text-body md:text-h6 text-text-2 mt-4 mb-14 xl:mb-18"
        >
          조용히 쌓인 기록이, 가장 단단한 성장을 만듭니다.
        </motion.p>

        <motion.div variants={reduce ? undefined : itemVariants}>
          <HomeMoreBtn text="기록 보러가기" to="/class" />
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 w-full bg-[linear-gradient(to_top,#000,#00000000)] md:h-[200px]" />
    </section>
  );
}

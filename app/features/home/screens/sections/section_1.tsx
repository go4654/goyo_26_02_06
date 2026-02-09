import { AuroraText } from "~/core/components/ui/aurora-text";
import { Button } from "~/core/components/ui/button";
import { Particles } from "~/core/components/ui/particles";
import Container from "~/core/layouts/container";

import HomeMoreBtn from "../../components/home-more-btn";

export default function Section1() {
  return (
    <section className="relative h-screen w-full">
      {/* 별 흩어진 효과 */}
      <div className="absolute top-0 left-0 h-screen w-full overflow-hidden">
        <Particles quantity={500} />
      </div>

      {/*왼쪽 하단 원형 그라데이션 */}
      <div className="absolute bottom-0 -left-[10%] rounded-full bg-[linear-gradient(to_left,#7C4DFF,#000)] opacity-30 blur-xl md:h-[600px] md:w-[600px]"></div>

      {/* 오른쪽 상단 원형 그라데이션 */}
      <div className="absolute top-0 -right-[0%] rounded-full bg-[linear-gradient(to_left,#7C4DFF,#000)] opacity-20 blur-xl md:h-[600px] md:w-[600px]"></div>

      {/* 컨테이너 */}
      <Container>
        <div className="relative flex h-screen flex-col items-start justify-center">
          <h1 className="font-roboto text-[200px] leading-[180px] font-bold tracking-[-0.02em]">
            Silent Growth <br />
            <AuroraText colors={["#7C4DFF", "#BB86FC", "#03DAC6"]} speed={2}>
              Partner.
            </AuroraText>
          </h1>
          <p className="text-h6 text-text-2 mt-4 mb-14">
            조용히 쌓인 기록이, 가장 단단한 성장을 만듭니다.
          </p>
          <HomeMoreBtn text="기록 보러가기" />
        </div>

        {/* 아래 검은 그라데이션 */}
        <div className="absolute bottom-0 left-0 h-[200px] w-full bg-[linear-gradient(to_top,#000,#00000000)]"></div>
      </Container>
    </section>
  );
}

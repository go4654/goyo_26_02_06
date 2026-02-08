import { AuroraText } from "~/core/components/ui/aurora-text";
import { Button } from "~/core/components/ui/button";
import { Particles } from "~/core/components/ui/particles";
import Container from "~/core/layouts/container";

import HomeMoreBtn from "../../components/home-more-btn";

export default function Section1() {
  return (
    <section className="relative h-screen w-full">
      <div className="absolute top-0 left-0 h-screen w-full overflow-hidden">
        <Particles quantity={500} />
      </div>
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
      </Container>
    </section>
  );
}

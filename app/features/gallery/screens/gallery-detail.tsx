import type { Route } from "./+types/gallery-detail";

import Tags from "~/core/components/tags";
import { Separator } from "~/core/components/ui/separator";

import { DubleQuote } from "../components/duble_quote";
import FloatingActionBar from "../components/floating-action-bar";
import { galleryDetailAction } from "../server/gallery-detail.action";
import { galleryDetailLoader } from "../server/gallery-detail.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: "갤러리 상세 페이지" }];
};

export const loader = galleryDetailLoader;
export const action = galleryDetailAction;

export default function GalleryDetail({ loaderData }: Route.ComponentProps) {
  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-24 xl:py-40">
      {/* 배경 이미지 */}
      <div className="relative xl:h-[1000px]">
        <div className="aspect-[16/12] h-full w-full rounded-2xl bg-gray-500 bg-[url(/img/student_portfolio_ex_02.jpg)] bg-cover bg-top xl:aspect-[16/7]"></div>
        <div className="absolute inset-x-0 top-[60%] bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
      </div>

      {/* 타이틀 정보 */}
      <div className="mt-12 gap-3 xl:max-w-[70%]">
        <h1 className="text-h4 xl:text-h2">
          Harley-Davidson Official Website Renewal
        </h1>

        <p className="xl:text-h6 text-text-2/80 text-base font-light">
          브랜드 고유의 정체성을 유지하면서도, 복잡했던 탐색 과정을 사용자
          중심으로 명확하게 풀어낸 수작입니다.
        </p>

        <div className="mt-4 xl:mt-8">
          <Tags tags={["Web", "UX/UI", "Publishing"]} />
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="my-12 xl:max-w-[50%]">
        <p className="text-text-2/80 leading-loose font-light xl:text-[20px]">
          Focus: 정체된 브랜드 이미지를 디지털 환경에 최적화하기 기존
          할리데이비슨 사이트는 강력한 마니아층을 보유하고 있음에도 불구하고,
          복잡한 메뉴 구조와 파편화된 비주얼 요소들로 인해 신규 유저(Young
          Generation)의 유입에 장벽이 있었습니다. 이번 리뉴얼의 목적은 **'자유와
          저항'**이라는 브랜드 스피릿을 유지하되, 이커머스로서의 편리한 구매
          여정과 모델 비교 기능을 강화하는 것에 초점을 맞췄습니다.
        </p>

        <div className="text-small-title text-text-2 font-regular mt-8">
          송OO 학생
        </div>
      </div>

      {/* 상세 이미지 */}
      <div className="xl:mt-20">
        <img
          src="/img/student_portfolio_ex_02.jpg"
          alt="student_portfolio_ex_02"
        />
      </div>

      {/* 프로젝트를 통해 배운 점 */}
      <div className="mx-auto my-20 flex max-w-[800px] flex-col items-center justify-center gap-4 xl:my-80">
        <DubleQuote className="mb-6 size-16 text-white/15" />

        <h3 className="text-h4 xl:text-h3">프로젝트를 통해 배운 점</h3>
        <p className="text-text-2 text-center text-base leading-loose font-light xl:text-[22px]">
          단순히 예쁜 페이지를 만드는 것보다, 브랜드가 가진 역사적인 맥락을
          어떻게 현대적인 인터페이스로 번역할지 고민하는 과정이 가장 힘들었지만
          유익했습니다. 특히 수파베이스를 활용해 실제 데이터를 연동해 보며
          개발자와의 소통 방식에 대해서도 깊게 배울 수 있었습니다.
        </p>

        <DubleQuote className="mt-6 size-16 rotate-180 text-white/15" />
      </div>

      <Separator className="mt-26 mb-6" />

      {/* 좋아요, 북마크 버튼 */}
      <FloatingActionBar />
    </div>
  );
}

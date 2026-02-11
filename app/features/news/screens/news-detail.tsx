import type { Route } from "./+types/news-detail";

import { Separator } from "~/core/components/ui/separator";

import { NEWS_DETAIL_DATA } from "../constants/new-mockup";
import { newsDetailAction } from "../server/news-detail.action";
import { newsDetailLoader } from "../server/news-detail.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: "뉴스 상세 페이지" }];
};

export const loader = newsDetailLoader;
export const action = newsDetailAction;

export default function NewsDetail({ loaderData }: Route.ComponentProps) {
  return (
    <div className="mx-auto max-w-[800px] py-24 xl:py-40">
      {/* 타이틀 영역 */}
      <div className="flex flex-col items-start gap-5">
        <div className="">
          <div className="text-small xl:text-small-title text-primary">
            NOTICE
          </div>
          <h1 className="text-h5 xl:text-h3">
            GOYO 아카이브 시스템 고도화: 학습의 경계를 허무는 '연결된 기록'
            업데이트 안내
          </h1>
        </div>
        <span className="text-text-2/80 text-small xl:text-small-title font-light">
          2026.02.10
        </span>
      </div>

      <Separator className="my-10" />

      {/* dangerouslySetInnerHTML를 사용할 때는 반드시 prose 클래스로 스타일을 잡아줍니다. */}
      <div
        className="/* 1. 기본 레이아웃 & 폰트 세팅 */ prose prose-neutral xl:prose-lg /* 2. 본문 텍스트: 가독성을 위해 자간과 색상 미세 조정 */ prose-p:leading-9 prose-p:text-neutral-700 prose-p:tracking-tight /* 3. 제목(H3): 더 굵고 확실한 존재감 + 하단 보더 */ prose-h3:mt-16 prose-h3:pb-4 prose-h3:border-b prose-h3:border-neutral-100 prose-h3:text-3xl prose-h3:font-extrabold prose-h3:text-neutral-900 /* 4. 인용구(Blockquote): 세련된 박스 형태 + 큰 따옴표 효과 */ prose-blockquote:not-italic prose-blockquote:border-l-4 prose-blockquote:border-secondary prose-blockquote:bg-neutral-50 prose-blockquote:rounded-r-2xl prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:text-neutral-700 prose-blockquote:font-medium prose-blockquote:shadow-sm /* 5. 강조(Strong): 색상만 바꾸지 말고 배경색 살짝 깔기 */ prose-strong:text-secondary prose-strong:font-bold prose-strong:bg-secondary/5 prose-strong:px-1 prose-strong:rounded-sm /* 6. 이미지 & 리스트: 디테일 마감 */ prose-img:rounded-3xl prose-img:shadow-xl prose-img:my-12 prose-li:text-neutral-600 prose-ol:font-semibold /* 7. 링크(Anchor): 서비스 아이덴티티 반영 */ prose-a:text-secondary prose-a:no-underline hover:prose-a:underline max-w-none"
        dangerouslySetInnerHTML={{ __html: NEWS_DETAIL_DATA.content }}
      />
    </div>
  );
}

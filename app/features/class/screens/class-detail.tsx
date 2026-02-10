import type { Route } from "./+types/class-detail";

import { Bookmark, Heart } from "lucide-react";
import { bundleMDX } from "mdx-bundler";
import remarkGfm from "remark-gfm";

import Tags from "~/core/components/tags";

import { CLASS_DETAIL_MOCKUP_SOURCE } from "../constants/class-detail-mockup";
import MDXRenderer from "./class-markdown-rander";

export const meta: Route.MetaFunction = () => {
  return [{ title: "CLASS | 고요" }];
};

export async function loader() {
  const source = CLASS_DETAIL_MOCKUP_SOURCE;

  const { code } = await bundleMDX({
    source,
    mdxOptions(options) {
      options.remarkPlugins = [...(options.remarkPlugins ?? []), remarkGfm];
      return options;
    },
  });

  return { code };
}

export default function ClassDetail({ loaderData }: Route.ComponentProps) {
  return (
    <div className="mx-auto w-full max-w-[800px] py-24 xl:py-40">
      {/* 타이틀 영역 */}
      <div>
        <div className="text-small-title text-text-3 flex items-center gap-2">
          <span>2026.02.10</span>
          <span>•</span>
          <div className="flex items-center gap-2">
            <Heart />
            <span>121</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <Bookmark />
            <span>54</span>
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-h4 xl:text-h2">
            비전공자도 칭찬받는 폰트 위계 잡기
          </h1>

          <p className="text-h6 text-text-2/80 mt-2">
            왜 내가 만든 디자인은 가독성이 떨어질까? 그 해답은 폰트의 크기가
            아니라 '위계'에 있습니다.
          </p>

          <div className="mt-6">
            <Tags tags={["퍼블리싱", "HTML"]} borderColor="primary" />
          </div>
        </div>
      </div>

      {/* 썸네일 영역 (기존 디자인 유지) */}
      <div className="mt-12">
        <div className="aspect-[16/7] rounded-2xl bg-white/10" />
      </div>

      {/* ✅ 여기부터가 새로 추가된 "본문 MDX 영역" */}
      <div className="">
        <MDXRenderer code={loaderData.code} />
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

import { ArrowRight } from "lucide-react";

import { Button } from "~/core/components/ui/button";

interface Props {
  title: string;
  description: string;
  studentName: string;
  imageUrl: string;
  responsiveImageUrl: string;
  children?: ReactNode; // 추가적인 상세 설명 카드들을 담기 위함
  siteUrl?: string;
}

{
  /*
  사이트 바로가기 URL은 siteUrl prop으로 전달합니다. 없으면 버튼이 안 보입니다.
  <MDXGalleryGrid
    title="포트폴리오 제목"
    studentName="학생 이름"
    description="설명"
    imageUrl="이미지 경로"
    responsiveImageUrl="반응형 이미지 경로"
    siteUrl="https://example.com"
  >
    <MDXGalleryGrid.Item title="01. 항목 제목">
      항목 설명
    </MDXGalleryGrid.Item>

    <MDXGalleryGrid.Item title="02. 항목 제목">
      항목 설명
    </MDXGalleryGrid.Item>
  </MDXGalleryGrid>
  */
}

export function MDXGalleryGrid({
  title,
  description,
  studentName,
  imageUrl,
  responsiveImageUrl,
  children,
  siteUrl,
}: Props) {
  const hasResponsiveImage =
    responsiveImageUrl && responsiveImageUrl.trim() !== "#";

  return (
    <div className="my-10 flex flex-col gap-10 xl:my-20">
      {/* 상단 메인 설명 */}

      <p className="text-text-3 font-regular text-base leading-relaxed tracking-wide xl:max-w-[70%] xl:text-[24px]">
        {description}
      </p>

      <p className="text-text-3 font-regular text-base leading-relaxed tracking-wide xl:max-w-[70%] xl:text-[24px]">
        {studentName}
      </p>

      <div className="flex flex-col gap-10 xl:flex-row xl:justify-between">
        {/* 왼쪽 영역: 메인 이미지 + 상세 설명 카드들 */}
        <div
          className={`flex flex-col gap-8 ${
            hasResponsiveImage ? "xl:w-[70%]" : "xl:w-full"
          }`}
        >
          <div className="overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
            <img src={imageUrl} alt={title} className="w-full object-cover" />
          </div>

          {/* 상세 설명 섹션 (children이 있을 경우 렌더링) */}
          <div className="grid gap-6">{children}</div>
        </div>

        {/* 오른쪽 영역: 반응형 이미지 */}
        {hasResponsiveImage && (
          <div className="xl:mt-[30%] xl:w-[25%]">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
              <img
                src={responsiveImageUrl}
                alt={`${title} responsive`}
                className="w-full object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {siteUrl && (
        <Button
          variant="outline"
          className="group !border-primary/80 hover:border-primary w-fit cursor-pointer"
          asChild
          disabled={!siteUrl}
        >
          <a href={siteUrl ?? ""} target="_blank" rel="noopener noreferrer">
            사이트 바로가기 <ArrowRight className="size-4" />
          </a>
        </Button>
      )}
    </div>
  );
}

// 상세 카드로 쓸 Item (기존 ThreeColumns.Item과 비슷하지만 갤러리용으로 최적화)
function GalleryItem({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="py-6 xl:py-15">
      <h4 className="text-text-1 xl:text-h4 text-small-title mb-3 font-semibold">
        {title}
      </h4>
      <div className="text-text-3 xl:text-h6 leading-relaxed font-[400] tracking-wide xl:w-[70%]">
        {children}
      </div>
    </div>
  );
}

MDXGalleryGrid.Item = GalleryItem;

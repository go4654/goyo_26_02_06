import type { Route } from "./+types/class";

import { SearchIcon } from "lucide-react";
import { Form, Link, useSearchParams } from "react-router";

import PaginationUI from "~/core/components/pagination-ui";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/core/components/ui/input-group";
import Container from "~/core/layouts/container";
import LectureCard from "~/features/class/components/lecture-card";
import { type ClassListItem } from "~/features/class/queries";
import { CATEGORY_DATA } from "~/features/home/constants/home-data";

import { classLoader } from "../server/class.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: "CLASS | 고요" }];
};

export const loader = classLoader;

// 카테고리 이름과 category 값 매핑
const CATEGORY_MAP: Record<string, string> = {
  "Photo shop": "photoshop",
  Illustrator: "illustrator",
  Figma: "figma",
  "UX UI": "uxui",
  Html: "html",
  Css: "css",
  Javascript: "javascript",
  jQuery: "jquery",
  React: "react",
  Git: "git",
  Typescript: "typescript",
};

export default function Class({ loaderData }: Route.ComponentProps) {
  const { category, classes, pagination, search } = loaderData;
  const [searchParams] = useSearchParams();

  /**
   * 페이지네이션 URL 생성 함수
   * 현재 카테고리와 검색어를 유지하면서 페이지 번호만 변경
   */
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `/class?${params.toString()}`;
  };

  /**
   * 페이지 변경 핸들러 (클라이언트 사이드 네비게이션)
   */
  const handlePageChange = (page: number) => {
    // React Router의 Link 컴포넌트가 자동으로 처리하므로 빈 함수
  };

  return (
    <div className="py-24 xl:py-40">
      <Container>
        {/* 상단 타이틀 및 검색 */}
        <div className="flex flex-col items-start justify-between xl:flex-row xl:items-end">
          <h1 className="text-h4 xl:text-h1 max-w-[600px]">
            From Lecture to Your Own <span className="text-primary">Logs.</span>
          </h1>

          {/* 검색 폼 */}
          <Form method="get" className="mt-4 w-full xl:mt-0 xl:w-[500px]">
            {/* 카테고리 파라미터 유지 (검색 시 페이지는 1로 리셋) */}
            <input type="hidden" name="category" value={category || ""} />
            
            <InputGroup className="h-[40px] rounded-full px-2 xl:h-[50px]">
              <InputGroupInput
                type="text"
                name="search"
                defaultValue={search || ""}
                placeholder="찾고싶은 기록이 있으신가요?"
                className="placeholder:text-text-2/40 text-sm"
              />
              <InputGroupAddon>
                <SearchIcon className="size-5" />
              </InputGroupAddon>
            </InputGroup>
          </Form>
        </div>

        {/* 카테고리 */}
        <div className="mt-[55px]">
          {CATEGORY_DATA.map((categoryGroup) => (
            <div
              key={categoryGroup.id}
              className="flex flex-col items-start border-t border-b py-4 xl:flex-row xl:items-center xl:py-8"
            >
              <h3 className="xl:text-h5 mb-4 text-base font-medium xl:mb-0 xl:w-[300px]">
                {categoryGroup.name}
              </h3>

              <ul className="xl:text-h6 text-text-2/40 flex flex-wrap gap-4 text-base font-light xl:gap-10">
                {categoryGroup.skills.map((skill) => {
                  const categoryValue = CATEGORY_MAP[skill.name];
                  const isActive = category === categoryValue;

                  return (
                    <li key={skill.id}>
                      <Link
                        to={`/class?category=${categoryValue}`}
                        className={`transition-colors ${
                          isActive
                            ? "text-text-1 font-medium"
                            : "hover:text-text-1"
                        }`}
                      >
                        {skill.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* 강의 목록 */}
        {classes && classes.length > 0 ? (
          <>
            <div className="mt-12 grid grid-cols-2 gap-2 gap-y-10 xl:mt-[120px] xl:grid-cols-4 xl:gap-6 xl:gap-y-16">
              {classes.map((classItem: ClassListItem) => (
                <LectureCard
                  key={classItem.id}
                  lecture={{
                    id: classItem.id,
                    title: classItem.title,
                    imageUrl: classItem.thumbnail_image_url || "",
                    category: classItem.category,
                    tags: [], // TODO: tags 필드가 스키마에 추가되면 연결
                    slug: classItem.slug,
                  }}
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex justify-center xl:mt-16">
                <PaginationUI
                  page={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  getPageUrl={getPageUrl}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-20 xl:mt-[160px]">
            <p className="text-text-2/60 text-h6">
              {search
                ? "검색 결과가 없습니다."
                : category && category.length > 0
                  ? "해당 카테고리에 강의가 없습니다."
                  : "강의를 선택해주세요."}
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}

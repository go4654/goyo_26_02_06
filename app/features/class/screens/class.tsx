import type { Route } from "./+types/class";

import Container from "~/core/layouts/container";

import Category from "../components/category";
import ClassList from "../components/class-list";
import SearchForm from "../components/search-form";
import { classAction } from "../server/class.action";
import { classLoader } from "../server/class.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: "CLASS | 고요" }];
};

export const loader = classLoader;
export const action = classAction;

export default function Class({ loaderData }: Route.ComponentProps) {
  const {
    category,
    classes,
    pagination,
    search,
    likedClasses,
    savedClasses,
    isLoggedIn,
  } = loaderData;

  return (
    <div className="py-24 xl:py-40">
      <Container>
        {/* 상단 타이틀 및 검색 */}
        <div className="flex flex-col items-start justify-between xl:flex-row xl:items-end">
          <h1 className="text-h4 xl:text-h1 max-w-[600px]">
            From Lecture to Your Own <span className="text-primary">Logs.</span>
          </h1>

          {/* 검색 폼 */}
          <SearchForm category={category} search={search} />
        </div>

        {/* 카테고리 */}
        <Category category={category} />

        {/* 강의 목록 */}
        <ClassList
          classes={classes}
          pagination={pagination}
          search={search}
          category={category}
          likedClasses={likedClasses}
          savedClasses={savedClasses}
          isLoggedIn={isLoggedIn}
        />
      </Container>
    </div>
  );
}

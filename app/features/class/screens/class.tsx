import type { Route } from "./+types/class";
import { useNavigation } from "react-router";

import Container from "~/core/layouts/container";

import Category from "../components/category";
import ClassList from "../components/class-list";
import ClassListSkeleton from "../components/class-list-skeleton";
import SearchForm from "../components/search-form";
import { classAction } from "../server/class.action";
import { classLoader } from "../server/class.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: "CLASS | 고요" }];
};

export const loader = classLoader;
export const action = classAction;

export default function Class({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const {
    category,
    classes,
    pagination,
    search,
    likedClasses,
    savedClasses,
    isLoggedIn,
  } = loaderData;

  const isLoading = navigation.state === "loading";

  return (
    <div className="py-6 xl:py-16">
      <Container>
        {/* 상단 타이틀 및 검색 */}
        <div className="flex flex-col items-start justify-between xl:flex-row xl:items-end">
          <h1 className="text-h4 xl:text-h1 max-w-[600px] tracking-tighter">
            From Lecture to <br /> Your Own{" "}
            <span className="text-primary">Logs.</span>
          </h1>

          {/* 검색 폼 */}
          <SearchForm category={category} search={search} />
        </div>

        {/* 카테고리 */}
        <Category category={category} />

        {/* 강의 목록 (로딩 중 스켈레톤 표시) */}
        {isLoading ? (
          <ClassListSkeleton />
        ) : (
          <ClassList
            classes={classes}
            pagination={pagination}
            search={search}
            category={category}
            likedClasses={likedClasses}
            savedClasses={savedClasses}
            isLoggedIn={isLoggedIn}
          />
        )}
      </Container>
    </div>
  );
}

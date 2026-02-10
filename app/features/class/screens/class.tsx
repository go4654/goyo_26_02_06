import type { Route } from "./+types/class";

import { SearchIcon } from "lucide-react";
import { Form, Link } from "react-router";

import Tags from "~/core/components/tags";
import { Input } from "~/core/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/core/components/ui/input-group";
import Container from "~/core/layouts/container";
import {
  type ClassLecture,
  getLecturesByCategory,
} from "~/features/class/constants/class-data";
import { CATEGORY_DATA } from "~/features/home/constants/home-data";

export const meta: Route.MetaFunction = () => {
  return [{ title: "CLASS | 고요" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const lectures = getLecturesByCategory(category);

  // TODO: 나중에 Supabase 연동 시 여기서 데이터 가져오기
  // const supabaseClient = makeServerClient(request)[0];
  // const { data } = await supabaseClient.from("lectures").select("*");

  return { category, lectures };
}

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
  const { category, lectures } = loaderData;
  return (
    <div className="py-24 xl:py-40">
      <Container>
        {/* 상단 타이틀 */}
        <div className="flex flex-col items-start justify-between xl:flex-row xl:items-end">
          <h1 className="text-h4 xl:text-h1 max-w-[600px]">
            From Lecture to Your Own <span className="text-primary">Logs.</span>
          </h1>

          {/* 검색 폼 */}
          <Form className="mt-4 w-full xl:mt-0 xl:w-[500px]">
            <InputGroup className="h-[40px] rounded-full px-2 xl:h-[50px]">
              <InputGroupInput
                type="text"
                name="search"
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
        {lectures.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-2 gap-y-10 xl:mt-[120px] xl:grid-cols-4 xl:gap-6 xl:gap-y-16">
            {lectures.map((lecture: ClassLecture) => (
              <Link
                to={`/class/${lecture.slug}`}
                className="group space-between hover:text-secondary flex flex-col items-start gap-2 transition-colors xl:h-[350px] xl:max-h-[350px] xl:gap-4"
                key={lecture.id}
              >
                {/* img 영역 */}
                <div className="h-full max-h-[350px] w-full overflow-hidden rounded-xl bg-gray-400 md:block md:max-h-[480px] xl:rounded-[20px]">
                  <img
                    src={lecture.imageUrl}
                    alt={lecture.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.1]"
                  />
                </div>

                {/* 타이틀 영역 */}
                <div className="flex flex-col gap-1 xl:gap-2">
                  <h3 className="xl:text-small-title mt-2 line-clamp-1 text-base font-medium xl:mt-0 xl:text-[20px]">
                    {lecture.title}
                  </h3>

                  <Tags tags={lecture.tags} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 xl:mt-[160px]">
            <p className="text-text-2/60 text-h6">
              {category
                ? "해당 카테고리에 강의가 없습니다."
                : "강의를 선택해주세요."}
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}

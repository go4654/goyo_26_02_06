import { Link } from "react-router";

import { CATEGORY_DATA } from "~/features/home/constants/home-data";

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

export default function Category({ category }: { category: string | null }) {
  return (
    <div className="mt-[55px]">
      {CATEGORY_DATA.map((categoryGroup) => (
        <div
          key={categoryGroup.id}
          className="flex flex-col items-start border-t border-b py-4 xl:flex-row xl:items-center xl:py-8"
        >
          {/* 카테고리 타이틀 */}
          <h3 className="xl:text-h6 mb-4 text-sm font-[300] xl:mb-0 xl:w-[300px]">
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
                      isActive ? "font-bold text-white" : "xl:hover:text-white"
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
  );
}

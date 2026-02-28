"use client";

import { motion } from "framer-motion";
import { Link } from "react-router";

import { CATEGORY_DATA } from "~/features/home/constants/home-data";

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
    <div className="mt-4 xl:mt-[55px]">
      {CATEGORY_DATA.map((categoryGroup) => (
        <div
          key={categoryGroup.id}
          className="flex flex-col items-start border-b py-4 xl:flex-row xl:items-center xl:border-t xl:py-8"
        >
          <h3 className="xl:text-h6 mb-2 text-sm font-[500] xl:mb-0 xl:w-[300px] xl:font-[300]">
            {categoryGroup.name}
          </h3>

          <ul className="text-text-2/60 xl:text-h6 relative flex flex-wrap gap-4 text-base font-light xl:gap-10">
            {categoryGroup.skills.map((skill) => {
              const categoryValue = CATEGORY_MAP[skill.name];
              const isActive = category === categoryValue;

              return (
                <li key={skill.id} className="relative">
                  <Link
                    to={`/class?category=${categoryValue}`}
                    className="relative z-10 px-2 py-1 text-sm xl:px-5 xl:py-2 xl:text-[18px]"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeCategory"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 35,
                        }}
                        className="dark:border-primary border-secondary dark:bg-primary/40 bg-primary/80 absolute inset-0 -z-10 rounded-full border"
                      />
                    )}

                    <span
                      className={`${
                        isActive
                          ? "dark:text-secondary text-white"
                          : "xl:hover:text-secondary"
                      }`}
                    >
                      {skill.name}
                    </span>
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

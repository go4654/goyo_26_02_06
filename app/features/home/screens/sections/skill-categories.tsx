import { Link } from "react-router";

import SectionTitle from "../../components/section-title";
import { CATEGORY_DATA } from "../../constants/home-data";

export default function SkillCategories() {
  return (
    <section className="py-20 md:py-40">
      <SectionTitle title="Skill Categories" link="/class" />

      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        {CATEGORY_DATA.map((data) => (
          <Link
            to={data.link}
            key={data.id}
            className="group flex flex-col gap-2 transition-colors duration-300 xl:gap-4"
          >
            {/* 이미지 영역 */}
            <div className="relative w-full overflow-hidden rounded-2xl transition-shadow duration-300 ease-out group-hover:shadow-[0_30px_120px_-20px_rgba(124,77,255,0.35)]">
              {/* 오버레이 */}
              <div className="pointer-events-none absolute inset-0 bg-black/0 transition-all duration-300 ease-out group-hover:bg-black/10" />

              <img
                src={data.image}
                alt={data.name}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              />
            </div>

            {/* 텍스트 영역 (고정) */}
            <div className="flex flex-col gap-1 xl:gap-2">
              <h3 className="text-h6 xl:text-h4 group-hover:text-primary tracking-tight transition-all duration-300 ease-out">
                {data.name}
              </h3>

              {/* 태그 */}
              <div className="flex flex-wrap items-center gap-2 xl:mt-2">
                {data.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="border-text-3/50 text-text-3/70 rounded-full border px-2 py-1 text-xs"
                  >
                    {skill.name}
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

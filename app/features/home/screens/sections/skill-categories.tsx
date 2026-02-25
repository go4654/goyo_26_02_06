import { MoveRight } from "lucide-react";
import { Link } from "react-router";

import SectionTitle from "../../components/section-title";
import { CATEGORY_DATA } from "../../constants/home-data";

export default function SkillCategories() {
  return (
    <section className="py-20 md:py-40">
      <SectionTitle title="Skill Categories" link="/class" />

      <div className="gird-cols-1 grid gap-10 md:grid-cols-3">
        {CATEGORY_DATA.map((data) => (
          <Link
            to={data.link}
            className="group space-between hover:text-primary flex flex-col items-start gap-2 transition-colors md:gap-6"
            key={data.id}
          >
            <div className="w-full overflow-hidden rounded-2xl md:block md:max-h-[480px]">
              <img
                src={data.image}
                alt={data.name}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.1]"
              />
            </div>

            <div className="flex flex-col gap-1 xl:gap-2">
              {/* 타이틀 */}
              <h3 className="text-small-title xl:text-h4">{data.name}</h3>

              {/* 태그 */}
              <div className="mt-1 flex flex-wrap items-center gap-2 xl:mt-2">
                {data.skills.map((skill) => (
                  <div
                    className="border-text-3/50 text-text-3/70 rounded-full border px-2 py-1 text-xs"
                    key={skill.id}
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

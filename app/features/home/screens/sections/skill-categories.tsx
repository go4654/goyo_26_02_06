import { MoveRight } from "lucide-react";
import { Link } from "react-router";

import SectionTitle from "../../components/section-title";
import { CATEGORY_DATA } from "../../constants/home-data";

export default function SkillCategories() {
  return (
    <section className="py-40">
      <SectionTitle title="Skill Categories" link="/class" />

      <div className="grid grid-cols-3 gap-6">
        {CATEGORY_DATA.map((data) => (
          <Link
            to={data.link}
            className="group space-between hover:text-secondary flex flex-col items-start gap-6 transition-colors"
            key={data.id}
          >
            <div className="w-full overflow-hidden bg-gray-400 md:block md:max-h-[480px]">
              <img
                src={data.image}
                alt={data.name}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.1]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-h4">{data.name}</h3>

              <div className="flex items-center gap-2">
                {data.skills.map((skill) => (
                  <div
                    className="text-small border-text-3 text-text-3 rounded-full border px-2"
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

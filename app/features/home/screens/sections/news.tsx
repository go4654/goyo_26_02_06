import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import SectionTitle from "../../components/section-title";
import { NEWS_DATA } from "../../constants/home-data";

export default function News() {
  return (
    <section className="pt-40 pb-80">
      <SectionTitle pointText="GOYO." title="NEWS" link="/news" />

      <div className="grid grid-cols-3 gap-8">
        {NEWS_DATA.map((data) => (
          <Link
            key={data.id}
            to={data.link}
            className="group flex items-start justify-between"
          >
            <span className="text-small-title text-text-2 font-light tracking-tighter">
              {data.date}
            </span>
            <div className="w-full max-w-[380px]">
              <h3 className="text-h6 group-hover:text-secondary leading-7">
                {data.title}
              </h3>
              <p className="text-text-2 mt-4 flex items-center gap-2">
                <span>Read More</span> <ArrowUpRight />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

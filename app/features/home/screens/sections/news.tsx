import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import SectionTitle from "../../components/section-title";
import { NEWS_DATA } from "../../constants/home-data";

export default function News() {
  return (
    <section className="pt-0 pb-40 xl:pt-40 xl:pb-80">
      <SectionTitle pointText="GOYO." title="NEWS" link="/news" />

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-3 xl:gap-8">
        {NEWS_DATA.map((data) => (
          <Link
            key={data.id}
            to={data.link}
            className="group flex flex-col items-start justify-between xl:flex-row"
          >
            <span className="xl:text-small-title text-text-2 mb-2 text-[12px] font-light tracking-tighter xl:mb-0">
              {data.date}
            </span>
            <div className="w-full max-w-[380px]">
              <h3 className="text-small-title xl:text-h6 group-hover:text-secondary leading-7">
                {data.title}
              </h3>
              <p className="text-text-2 text-small mt-4 flex items-center gap-2 xl:text-base">
                <span>Read More</span> <ArrowUpRight />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

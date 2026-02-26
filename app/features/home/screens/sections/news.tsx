import { ArrowUpRight } from "lucide-react";
import { DateTime } from "luxon";
import { Link } from "react-router";

import type { NewsListItem } from "~/features/news/queries";

import SectionTitle from "../../components/section-title";

interface NewsProps {
  recentNews: NewsListItem[];
}

function formatNewsDate(dateString: string | null): string {
  if (!dateString) return "";
  const dt = DateTime.fromISO(dateString);
  if (!dt.isValid) return "";
  return dt.toFormat("yyyy.MM.dd");
}

export default function News({ recentNews }: NewsProps) {
  const items = recentNews.slice(0, 3);

  return (
    <section className="pt-0 pb-40 xl:pt-40 xl:pb-80">
      <SectionTitle pointText="GOYO." title="NEWS" link="/news" />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3 xl:gap-8">
        {items.map((data) => (
          <Link
            key={data.id}
            to={`/news/${encodeURIComponent(data.slug)}`}
            className="group relative flex flex-col justify-between border-b pb-6 transition-all duration-300 hover:-translate-y-1 xl:border-0 xl:pb-0"
          >
            {/* 날짜 */}
            <span className="text-text-2 xl:text-small-title text-[12px] font-light tracking-tighter">
              {formatNewsDate(data.published_at)}
            </span>

            {/* 타이틀 */}
            <div className="mt-2 w-full max-w-[380px] xl:mt-4">
              <h3 className="text-small-title xl:text-h6 group-hover:text-primary relative leading-7">
                <span className="relative z-10 transition-colors duration-300">
                  {data.title}
                </span>

                {/* underline reveal */}
                {/* <span className="bg-primary/20 absolute bottom-0 left-0 h-[1px] w-0 py-1 transition-all duration-300 group-hover:w-full" /> */}
              </h3>
            </div>

            <ArrowUpRight className="group-hover:text-primary absolute top-0 right-0 opacity-60 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  );
}

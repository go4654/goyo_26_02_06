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

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-3 xl:gap-8">
        {items.map((data) => (
          <Link
            key={data.id}
            to={`/news/${encodeURIComponent(data.slug)}`}
            className="group flex flex-col items-start justify-between xl:flex-row"
          >
            {/* 뉴스 날짜 */}
            <span className="xl:text-small-title text-text-2 mr-4 mb-2 text-[12px] font-light tracking-tighter xl:mb-0">
              {formatNewsDate(data.published_at)}
            </span>

            {/* 뉴스 제목 */}
            <div className="w-full max-w-[380px]">
              <h3 className="text-small-title xl:text-h6 group-hover:text-primary leading-7">
                {data.title}
              </h3>

              {/* 뉴스 더보기 */}
              <p className="text-text-2 text-small mt-4 flex items-center gap-2 xl:text-base">
                <span>Read More</span>{" "}
                <ArrowUpRight className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

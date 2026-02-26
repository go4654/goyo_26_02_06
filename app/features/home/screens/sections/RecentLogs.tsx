import { Plus } from "lucide-react";
import { Link } from "react-router";

import type { ClassListItem } from "~/features/class/queries";

import HomeMoreBtn from "../../components/home-more-btn";

interface RecentLogsProps {
  recentClasses: ClassListItem[];
}

export default function RecentLogs({ recentClasses }: RecentLogsProps) {
  return (
    <section className="flex flex-col items-start justify-between py-20 md:flex-row xl:py-32">
      {/* 왼쪽 타이틀 */}
      <div className="w-full xl:w-[30%]">
        <h2 className="text-h3 xl:text-h2 mb-8 leading-14 tracking-tight xl:mb-24 xl:leading-20">
          <span className="text-primary">GOYO.</span> <br /> Recent Logs
        </h2>
        <HomeMoreBtn text="로그 보러가기" to="/class?category=figma" />
      </div>

      <div className="mt-16 w-full xl:mt-0 xl:w-[60%]">
        {recentClasses.slice(0, 5).map((data, index) => (
          <Link
            key={data.id}
            to={`/class/${data.slug}`}
            className="group mb-8 flex items-center justify-between transition-all duration-300"
          >
            {/* 번호 */}
            <p
              className={`text-h4 mr-6 font-light tracking-tighter transition-colors duration-300 ${index === 0 ? "text-primary mr-6 xl:mr-15" : "text-text-3/25 xl:mr-12"} group-hover:text-primary xl:text-6xl`}
            >
              0{index + 1}
            </p>

            {/* 콘텐츠 */}
            <div className="border-text-3/30 group-hover:border-primary/40 flex w-full items-center justify-between border-b pb-6 transition-all duration-300">
              <div>
                <h3 className="text-h6 xl:text-h4 group-hover:text-primary line-clamp-1 font-medium transition-colors duration-300">
                  {data.title}
                </h3>

                {data.description && (
                  <p className="text-small xl:text-caption text-text-3 line-clamp-1 leading-6 font-light transition-opacity duration-300 group-hover:opacity-80 xl:leading-7">
                    {data.description}
                  </p>
                )}
              </div>

              <Plus
                className="group-hover:text-primary size-10 transition-all duration-300 group-hover:rotate-45"
                strokeWidth={1}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

import { Plus } from "lucide-react";
import { Link } from "react-router";

import HomeMoreBtn from "../../components/home-more-btn";
import { CLASS_DATA } from "../../constants/home-data";

export default function RecentLogs() {
  return (
    <section className="flex flex-col items-start justify-between py-20 md:flex-row xl:py-32">
      {/* 오른쪽 타이틀 */}
      <div className="w-full xl:w-[30%]">
        <h2 className="text-h3 xl:text-h2 mb-8 leading-14 tracking-tight xl:mb-24 xl:leading-20">
          <span className="text-primary">GOYO.</span> <br /> Recent Logs
        </h2>
        <HomeMoreBtn text="로그 보러가기" />
      </div>

      {/* 왼쪽 로그 리스트 컨텐츠 */}
      <div className="mt-16 w-full xl:mt-0 xl:w-[60%]">
        {CLASS_DATA.map((data) => (
          <Link
            key={data.id}
            to={data.link}
            className="mb-8 flex items-center justify-between"
          >
            <p className="text-text-3/25 group-hover:text-primary text-h4 mr-4 font-light tracking-tighter xl:mr-10 xl:text-6xl">
              0{data.id + 1}
            </p>

            <div className="group border-text-3/30 mt-2 flex w-full items-center justify-between border-b pb-6">
              <div>
                <h3 className="text-h6 xl:text-h4 group-hover:text-primary font-medium">
                  {data.title}
                </h3>
                <p className="text-small xl:text-caption text-text-3 line-clamp-1 leading-6 font-light xl:leading-7">
                  {data.description}
                </p>
              </div>
              <Plus
                className="group-hover:text-primary size-10 transition-transform duration-300 group-hover:rotate-90"
                strokeWidth={1}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

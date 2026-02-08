import { Plus } from "lucide-react";
import { Link } from "react-router";

import HomeMoreBtn from "../../components/home-more-btn";
import { CLASS_DATA } from "../../constants/home-data";

export default function RecentLogs() {
  return (
    <section className="flex items-start justify-between py-32">
      {/* 오른쪽 타이틀 */}
      <div className="w-[30%]">
        <h2 className="text-h2 mb-24 leading-20 tracking-tight">
          <span className="text-primary">GOYO.</span> <br /> Recent Logs
        </h2>
        <HomeMoreBtn text="로그 보러가기" />
      </div>

      {/* 왼쪽 로그 리스트 컨텐츠 */}
      <div className="w-[60%]">
        {CLASS_DATA.map((data) => (
          <Link
            key={data.id}
            to={data.link}
            className="mb-8 flex items-center justify-between"
          >
            <p className="text-text-3/25 group-hover:text-primary mr-10 text-6xl font-light tracking-tighter">
              0{data.id + 1}
            </p>

            <div className="group border-text-3/30 mt-2 flex w-full items-center justify-between border-b pb-6">
              <div>
                <h3 className="text-h4 group-hover:text-primary font-medium">
                  {data.title}
                </h3>
                <p className="text-caption text-text-3 font-light">
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

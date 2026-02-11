import { Bookmark, Heart } from "lucide-react";
import { Link } from "react-router";

import Tags from "~/core/components/tags";
import type { ClassLecture } from "~/features/class/constants/class-data";

interface LectureCardProps {
  lecture: ClassLecture;
  to?: string;
}

export default function LectureCard({ lecture, to }: LectureCardProps) {
  const linkTo = to ?? `/class/${lecture.slug}`;

  return (
    <Link
      to={linkTo}
      className="group space-between flex flex-col items-start gap-2 transition-colors xl:h-[350px] xl:max-h-[350px] xl:gap-4"
    >
      {/* img 영역 */}
      <div className="group relative h-full max-h-[350px] w-full overflow-hidden rounded-xl bg-gray-400 md:block md:max-h-[480px] xl:rounded-[20px]">
        <img
          src={lecture.imageUrl}
          alt={lecture.title}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.1]"
        />

        {/* 블랙 오버레이 좋아요, 북마크 버튼*/}
        <div className="absolute top-0 right-0 h-full w-full">
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <div className="hover:bg-primary rounded-full bg-gray-500/30 p-3 hover:text-white">
              <Heart className="size-4 xl:size-5" />
            </div>
            <div className="hover:bg-primary rounded-full bg-gray-500/30 p-3 hover:text-white">
              <Bookmark className="size-4 xl:size-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 타이틀 영역 */}
      <div className="flex flex-col gap-1 xl:gap-2">
        <h3 className="xl:text-small-title group-hover:text-primary mt-2 line-clamp-1 text-base font-medium xl:mt-0 xl:text-[20px]">
          {lecture.title}
        </h3>

        <Tags tags={lecture.tags} />
      </div>
    </Link>
  );
}

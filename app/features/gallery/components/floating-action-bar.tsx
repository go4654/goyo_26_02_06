import { Bookmark, Heart, MoveLeft, MoveRight } from "lucide-react";
import { Link, useNavigate } from "react-router";

export default function FloatingActionBar() {
  const navigate = useNavigate();

  return (
    <div className="flex w-full flex-col items-center justify-between">
      {/* 목록으로가기, 좋아요, 북마크 버튼 */}
      <div className="flex w-full items-center justify-between">
        {/* 목록으로가기 */}
        <div
          className="xl:text-small-title text-text-2 hover:text-primary flex cursor-pointer items-center gap-2 text-sm"
          onClick={() => navigate(-1)}
        >
          <MoveLeft className="size-4" />
          <span>목록으로 가기</span>
        </div>

        {/* 좋아요, 북마크 버튼 */}
        <div className="text-small-title text-text-3 flex items-center gap-2">
          <div className="flex cursor-pointer items-center gap-2">
            <Heart className="size-4 xl:size-5" />
            <span className="text-sm xl:text-base">121</span>
          </div>
          <span className="text-text-3/50">•</span>
          <div className="flex cursor-pointer items-center gap-2">
            <Bookmark className="size-4 xl:size-5" />
            <span className="text-sm xl:text-base">54</span>
          </div>
        </div>
      </div>

      <div className="mt-10 flex w-[180px] items-center justify-between xl:w-[220px]">
        <Link to="/class/1" className="group flex items-center gap-2">
          <div className="border-text-2 flex h-[30px] w-[30px] items-center justify-start rounded-full border group-hover:border-white xl:h-[35px] xl:w-[35px]">
            <MoveLeft
              className="text-text-2 ml-1 size-4 transition-all duration-300 group-hover:text-white xl:size-5"
              strokeWidth={1}
            />
          </div>
          <span className="text-small-title text-text-2 text-sm transition-all duration-300 group-hover:text-white xl:text-base">
            PREV
          </span>
        </Link>

        <Link to="/class/2" className="group flex items-center gap-2">
          <span className="text-small-title text-text-2 xl:text-bas e text-sm transition-all duration-300 group-hover:text-white">
            NEXT
          </span>
          <div className="border-text-2 flex h-[30px] w-[30px] items-center justify-start rounded-full border group-hover:border-white xl:h-[35px] xl:w-[35px]">
            <MoveRight
              className="text-text-2 ml-1 size-4 transition-all duration-300 group-hover:text-white xl:size-5"
              strokeWidth={1}
            />
          </div>
        </Link>
      </div>
    </div>
  );
}

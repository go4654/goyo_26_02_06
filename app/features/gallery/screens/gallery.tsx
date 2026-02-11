import type { Route } from "./+types/gallery";

import { Heart } from "lucide-react";
import { Link } from "react-router";

import Tags from "~/core/components/tags";

import { GALLERY_LIST_MOCKUP } from "../constant/gallery-list-mockup";
import { galleryAction } from "../server/gallery.action";
import { galleryLoader } from "../server/gallery.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: "갤러리 페이지" }];
};

export const loader = galleryLoader;
export const action = galleryAction;

export default function Gallery() {
  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-24 xl:py-40">
      {/* 카테고리 목록 */}
      <ul className="xl:text-h6 flex items-center gap-10">
        <li className="relative">
          <Link to={"/gallery?category=all"}>All</Link>
          <div className="bg-primary absolute -bottom-2 left-0 h-1 w-full"></div>
        </li>
        <li>
          <Link to={"/gallery?category=design"}>Deisgn</Link>
        </li>
        <li>
          <Link to={"/gallery?category=publishing"}>Publishing</Link>
        </li>
        <li>
          <Link to={"/gallery?category=development"}>Development</Link>
        </li>
      </ul>

      {/* 갤러리 목록 */}
      <div className="mt-16 grid grid-cols-2 gap-2 gap-y-16 xl:grid-cols-4 xl:gap-6">
        {/* 갤러리 컨텐츠 */}
        {GALLERY_LIST_MOCKUP.map((data) => (
          <Link to={`/gallery/${data.id}`} key={data.id}>
            <div className="h-[200px] w-full overflow-hidden rounded-2xl md:h-[500px] lg:h-[500px]">
              <img
                src={data.image}
                alt={data.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mt-2 mb-2 flex items-center justify-between">
              {/* 타이틀 */}
              <h3 className="text-small md:text-small-title line-clamp-1">
                {data.title}
              </h3>

              {/* 좋아요 */}
              <div className="text-text-2 flex items-center gap-1 md:gap-2">
                <Heart className="size-4 md:size-5" />
                <span className="text-sm md:text-base">{data.likeCount}</span>
              </div>
            </div>

            {/* 태그 */}
            <Tags tags={data.tags} borderColor="primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}

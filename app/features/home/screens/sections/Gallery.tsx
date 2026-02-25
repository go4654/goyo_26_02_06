import { Link } from "react-router";

import SectionTitle from "../../components/section-title";
import type { GalleryListItem } from "~/features/gallery/queries";

interface GalleryProps {
  highlightedGalleries: GalleryListItem[];
}

export default function Gallery({ highlightedGalleries }: GalleryProps) {
  return (
    <section className="py-20 xl:py-40">
      <SectionTitle title="Gallery Highlight" link="/gallery" />

      <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
        {highlightedGalleries.map((data) => (
          <Link
            to={`/gallery/${data.slug}`}
            key={data.id}
            className="group"
          >
            <div className="h-[150px] w-full overflow-hidden rounded-2xl xl:h-[280px]">
              <img
                src={data.thumbnail_image_url ?? ""}
                alt={data.title}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.1]"
              />
            </div>

            <div className="mt-2 flex flex-col items-start justify-between xl:flex-row">
              <h3 className="text-small-title xl:text-h6 group-hover:text-primary line-clamp-1 max-w-[70%] leading-7">
                {data.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

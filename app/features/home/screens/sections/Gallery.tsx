import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router";

import type { GalleryListItem } from "~/features/gallery/queries";

import SectionTitle from "../../components/section-title";

interface GalleryProps {
  highlightedGalleries: GalleryListItem[];
}

export default function Gallery({ highlightedGalleries }: GalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-20 xl:py-40">
      <SectionTitle title="Gallery Highlight" link="/gallery" />

      <div className="grid grid-cols-2 gap-2 gap-y-6 xl:grid-cols-4 xl:gap-6">
        {highlightedGalleries.map((data, index) => {
          const isActive = hoveredIndex === index;
          const isDimmed = hoveredIndex !== null && hoveredIndex !== index;

          return (
            <motion.div
              key={data.id}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              animate={{
                scale: isActive ? 1.06 : isDimmed ? 0.98 : 1,
                opacity: isDimmed ? 0.3 : 1,
                filter: isDimmed ? "blur(2px)" : "blur(0px)",
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 22,
              }}
              className="group relative"
            >
              <Link to={`/gallery/${data.slug}`} className="block">
                <div className="h-[150px] w-full overflow-hidden rounded-2xl md:h-[350px] xl:h-[280px]">
                  <img
                    src={data.thumbnail_image_url ?? ""}
                    alt={data.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <h3 className="xl:text-h6 group-hover:text-primary mt-2 line-clamp-1 text-base xl:mt-3">
                  {data.title}
                </h3>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

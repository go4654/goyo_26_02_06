import { Link } from "react-router";

import SectionTitle from "../../components/section-title";
import { GALLERY_DATA } from "../../constants/home-data";

export default function Gallery() {
  return (
    <section className="py-40">
      <SectionTitle title="Gallery Highlight" link="/gallery" />

      <div className="grid grid-cols-4 gap-6">
        {GALLERY_DATA.map((data) => (
          <Link to={data.link} key={data.id} className="group">
            <div className="h-[280px] w-full overflow-hidden rounded-2xl">
              <img
                src={data.image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.1]"
              />
            </div>

            <div className="mt-2 flex justify-between">
              <h3 className="text-small-title group-hover:text-secondary">
                {data.title}
              </h3>
              <p className="text-caption text-text-3">{data.date}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

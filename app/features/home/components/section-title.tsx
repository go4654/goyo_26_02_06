import { MoveRight } from "lucide-react";
import { Link } from "react-router";

export default function SectionTitle({
  title,
  link,
}: {
  title: string;
  link: string;
}) {
  return (
    <div className="mb-12 flex items-end justify-between">
      <h2 className="text-h3">{title}</h2>

      <div className="bg-text-2 h-[1px] w-[60%] opacity-30"></div>

      <Link
        to={link}
        className="text-h6 text-text-2 hover:text-primary flex items-center gap-2 transition-colors"
      >
        View More <MoveRight className="mt-1" />
      </Link>
    </div>
  );
}

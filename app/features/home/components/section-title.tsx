import { MoveRight } from "lucide-react";
import { Link } from "react-router";

export default function SectionTitle({
  title,
  link,
  pointText,
}: {
  title: string;
  link: string;
  pointText?: string;
}) {
  return (
    <div className="mb-10 flex items-end justify-between tracking-tighter xl:mb-12">
      {!pointText ? (
        <h2 className="xl:text-h3 text-[32px] leading-7 font-semibold">
          {title}
        </h2>
      ) : (
        <h2 className="text-h4 xl:text-h3 leading-7">
          <span className="text-primary">{pointText}</span> {title}
        </h2>
      )}

      <div className="bg-text-2 hidden h-[1px] w-[60%] opacity-30 2xl:block"></div>

      <Link
        to={link}
        className="text-small xl:text-h6 text-text-2 hover:text-primary flex items-center gap-2 transition-colors"
      >
        View More <MoveRight className="mt-1 hidden md:block" />
      </Link>
    </div>
  );
}

import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";

export default function HomeMoreBtn({
  text,
  to,
}: {
  text: string;
  to: string;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className="group !border-primary/80 hover:border-primary relative overflow-hidden rounded-2xl border bg-transparent px-8 py-5 text-sm text-white transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(124,77,255,0.35)] xl:py-6 xl:text-base"
    >
      <Link to={to} className="relative z-10 flex items-center gap-2">
        <span>{text}</span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>

        {/* light sweep layer */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      </Link>
    </Button>
  );
}

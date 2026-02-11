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
      className="border-secondary dark:border-secondary dark:hover:bg-primary md:text-md border-1 py-5 text-sm md:px-8 md:py-6"
    >
      <Link to={to}>{text} &rarr;</Link>
    </Button>
  );
}

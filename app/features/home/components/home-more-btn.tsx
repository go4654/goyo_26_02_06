import { Button } from "~/core/components/ui/button";

export default function HomeMoreBtn({ text }: { text: string }) {
  return (
    <Button
      variant="outline"
      className="border-secondary dark:border-secondary dark:hover:bg-primary text-md border-1 px-8 py-6"
    >
      {text} &rarr;
    </Button>
  );
}

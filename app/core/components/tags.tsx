import { cn } from "../lib/utils";

export default function Tags({
  tags,
  borderColor = "text-3",
}: {
  tags: string[];
  borderColor?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag, index) => (
        <div
          className={cn(
            "border-text-3 text-text-3 rounded-full border px-2 py-1 text-xs",
            borderColor ? `border-${borderColor}` : "border-text-3",
          )}
          key={index}
        >
          {tag}
        </div>
      ))}
    </div>
  );
}

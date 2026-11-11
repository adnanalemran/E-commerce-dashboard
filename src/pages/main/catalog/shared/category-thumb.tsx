import { TagIcon } from "@/icons";
import { cn } from "@/utils";

export interface CategoryThumbProps {
  src: string | null;
  alt: string;
  className?: string;
}

/** Square category image with an icon placeholder when there is no image. */
export default function CategoryThumb({ src, alt, className }: CategoryThumbProps) {
  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-white/3 dark:text-gray-500",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <TagIcon className="size-5" aria-hidden="true" />
      )}
    </div>
  );
}

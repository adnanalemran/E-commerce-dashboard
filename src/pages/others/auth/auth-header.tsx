import { Logo } from "@/components/shared/logo";
import { cn } from "@/utils";
import { Link } from "react-router";

export interface AuthHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  showLogo?: boolean;
  className?: string;
}

export default function AuthHeader({
  title,
  description,
  badge = "Admin Portal",
  showLogo = true,
  className,
}: AuthHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col items-center text-center", className)}>
      {showLogo && (
        <Link
          to="/"
          className="mb-4 inline-flex items-center transition-transform hover:scale-105"
          aria-label="E-Dukan"
        >
          <Logo markClassName="size-11" />
        </Link>
      )}

      {badge && (
        <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-50/80 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
          <span className="size-1.5 rounded-full bg-brand-500 dark:bg-brand-400" />
          {badge}
        </span>
      )}

      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h1>

      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
}

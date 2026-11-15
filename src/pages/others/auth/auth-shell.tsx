import { ChevronLeftIcon } from "@/icons";
import { cn } from "@/utils";
import type { ReactNode } from "react";
import { Link } from "react-router";

export interface AuthShellProps {
  children: ReactNode;
  /** Optional back link shown above the content. */
  back?: { to: string; label: string };
  className?: string;
}

export default function AuthShell({ children, back, className }: AuthShellProps) {
  return (
    <div className="w-full max-w-[440px]">
      {back && (
        <div className="mb-4">
          <Link
            to={back.to}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ChevronLeftIcon className="size-4 rtl:rotate-180" />
            <span>{back.label}</span>
          </Link>
        </div>
      )}

      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white/95 p-6 shadow-xl shadow-gray-200/50 backdrop-blur-xl sm:p-8 dark:border-gray-800/80 dark:bg-gray-900/90 dark:shadow-2xl dark:shadow-black/50",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

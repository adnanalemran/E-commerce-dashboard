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

/** Left-hand column of `AuthLayout`: optional back link plus vertically centred content. */
export default function AuthShell({ children, back, className }: AuthShellProps) {
  return (
    <div
      className={cn(
        "no-scrollbar flex w-full flex-1 flex-col overflow-y-auto lg:w-1/2",
        className,
      )}
    >
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
        {back && (
          <Link
            to={back.to}
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon className="rtl:rotate-180" />
            {back.label}
          </Link>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-10">
        {children}
      </div>
    </div>
  );
}

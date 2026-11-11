import { cn } from "@/utils";
import type { ReactNode } from "react";

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/3",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Title + description on the left, an action on the right. */
export function SectionRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-gray-200 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center dark:border-gray-800">
      <div>
        <h4 className="mb-1 text-base font-medium text-gray-800 dark:text-white/90">
          {title}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="flex shrink-0 items-center">{action}</div>
    </div>
  );
}

export function InfoField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">{label}</p>
      <div className="min-w-0 text-sm font-medium break-words text-gray-800 sm:text-base dark:text-white/90">
        {children}
      </div>
    </div>
  );
}

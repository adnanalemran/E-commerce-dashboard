import { Badge } from "@/components/ui/badge";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import { cn } from "@/utils";
import React from "react";

export interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: string;
  direction?: "up" | "down";
  badge?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export default function MetricCard({
  icon,
  title,
  value,
  change,
  direction = "up",
  badge,
  className,
  children,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "surface-card p-5 md:p-6",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90 [&>svg]:size-6">
        {icon}
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {value}
          </h4>
        </div>

        {badge !== undefined ? (
          badge
        ) : change ? (
          <Badge color={direction === "down" ? "error" : "success"}>
            {direction === "down" ? (
              <ArrowDownIcon className="text-error-500" />
            ) : (
              <ArrowUpIcon />
            )}
            {change}
          </Badge>
        ) : null}
      </div>

      {children}
    </div>
  );
}

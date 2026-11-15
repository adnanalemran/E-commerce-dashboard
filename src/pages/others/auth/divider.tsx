import { cn } from "@/utils";

export interface AuthDividerProps {
  label?: string;
  className?: string;
}

export default function AuthDivider({
  label = "Or",
  className,
}: AuthDividerProps) {
  return (
    <div className={cn("relative my-4", className)}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200/80 dark:border-gray-800" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-white px-3 font-medium uppercase tracking-wider text-gray-400 dark:bg-gray-900 dark:text-gray-500">
          {label}
        </span>
      </div>
    </div>
  );
}

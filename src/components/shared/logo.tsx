import { cn } from "@/utils";

/** House-and-basket mark shared with the storefront (`E-commerce-website/src/components/Logo.tsx`). */
export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M24 4 4 19v3h4v20h32V22h4v-3Z" fill="#0f1623" />
      <path d="M24 9.5 9.5 20.5V39h29V20.5Z" fill="#fff" />
      <path d="M15 27h18l-2 9H17Z" fill="#1e293b" />
      <path d="M18 27c0-4 2.7-6 6-6s6 2 6 6" fill="none" stroke="#1e293b" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 21c1.6-3 4-4.4 7-4.4-.4 3-2.6 4.8-7 4.4Z" fill="#38bdf8" />
    </svg>
  );
}

interface LogoProps {
  /** White text, for use on the green brand panel. */
  light?: boolean;
  className?: string;
  markClassName?: string;
}

/** Mark + "ই-দোকান / E-DUKAN" wordmark, matching the storefront header. */
export function Logo({ light = false, className, markClassName = "size-10" }: LogoProps) {
  return (
    <span className={cn("flex shrink-0 items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <span className="leading-none" lang="bn">
        <span
          className={cn(
            "block text-[22px] font-extrabold tracking-tight",
            light ? "text-white" : "text-brand-500 dark:text-white",
          )}
        >
          ই-দোকান
        </span>
        <span
          lang="en"
          className={cn(
            "block text-[10px] font-bold tracking-[0.22em] uppercase",
            light ? "text-white/80" : "text-leaf dark:text-brand-400",
          )}
        >
          E-Dukan
        </span>
      </span>
    </span>
  );
}

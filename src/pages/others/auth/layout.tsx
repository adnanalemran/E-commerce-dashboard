import { Outlet } from "react-router";
import ThemeToggler from "./theme-toggler";

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-gray-50/70 p-4 transition-colors sm:p-6 md:p-8 dark:bg-[#0c1017]">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(34,160,107,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(34,160,107,0.18),transparent_70%)]"
        aria-hidden="true"
      />

      {/* Top bar with Storefront link and Theme toggler */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between py-2">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Storefront</span>
          <span className="text-[10px] text-gray-400">↗</span>
        </a>

        <div className="flex items-center gap-2">
          <ThemeToggler />
        </div>
      </header>

      {/* Main content centered */}
      <main className="relative z-10 my-auto flex w-full items-center justify-center py-6">
        <Outlet />
      </main>

      {/* Modern subtle footer */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl py-3 text-center text-xs text-gray-400 dark:text-gray-600">
        <p>© {new Date().getFullYear()} E-Dukan Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
}

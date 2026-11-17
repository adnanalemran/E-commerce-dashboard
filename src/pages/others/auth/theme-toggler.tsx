import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts";
import { MoonIcon, SunIcon } from "@/icons";

export default function ThemeToggler() {
  const { toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="size-9 rounded-xl border border-gray-200/80 bg-white/80 text-gray-600 shadow-xs backdrop-blur-sm transition-all hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      <MoonIcon className="size-4.5 block dark:hidden" />
      <SunIcon className="size-4.5 hidden dark:block" />
    </Button>
  );
}

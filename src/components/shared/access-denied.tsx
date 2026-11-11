import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import { LockIcon } from "@/icons";
import { Link } from "react-router";

/** Shown in place of a page the signed-in user's role cannot access. */
export function AccessDenied() {
  const t = useTranslations("accessDenied");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 surface-card px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
        <LockIcon className="size-6" />
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("title")}
        </h2>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {t("description")}
        </p>
      </div>
      <Button variant="outline" render={<Link to="/" />} nativeButton={false}>
        {t("backHome")}
      </Button>
    </div>
  );
}

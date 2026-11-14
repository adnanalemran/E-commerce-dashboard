import GridShape from "@/components/shared/grid-shape";
import { Logo } from "@/components/shared/logo";
import { useTranslations } from "@/i18n";
import { Link, Outlet } from "react-router";
import ThemeToggler from "./theme-toggler";

export default function AuthLayout() {
  const t = useTranslations("auth");

  return (
    <div className="relative z-1 bg-white p-6 sm:p-0 dark:bg-gray-900">
      <div className="relative flex h-screen w-full flex-col justify-center sm:p-0 lg:flex-row dark:bg-gray-900">
        <Outlet />
        <div className="relative hidden h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(120%_90%_at_10%_10%,#22a06b_0%,transparent_55%),radial-gradient(90%_80%_at_90%_90%,#1b7f55_0%,transparent_55%),linear-gradient(135deg,#0f4224_0%,#14532d_50%,#0c351d_100%)] lg:grid lg:w-1/2">
          <div className="z-1 flex h-full items-center justify-center">
            <GridShape />

            <div className="flex max-w-xs flex-col items-center">
              <Link to="/" className="mb-4 block" aria-label="E-Dukan">
                <Logo light markClassName="size-12" />
              </Link>
              <p className="text-center text-white/80">
                {t("brandTagline")}
              </p>
            </div>
          </div>
        </div>

        <div className="fixed inset-e-6 bottom-6 z-50 hidden sm:block">
          <ThemeToggler />
        </div>
      </div>
    </div>
  );
}

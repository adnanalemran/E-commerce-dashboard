import { SidebarHeader } from "@/components/ui/sidebar";
import { Link } from "react-router";

interface AppSidebarHeaderProps {
  showContent: boolean;
}

export default function AppSidebarHeader({
  showContent,
}: AppSidebarHeaderProps) {
  return (
    <SidebarHeader className="px-5 py-8">
      <Link to="/">
        {showContent ? (
          <>
            <img
              className="h-9 w-auto dark:hidden"
              src="/images/logo/logo.svg"
              alt="E-Dukan"
            />
            <img
              className="hidden h-9 w-auto dark:block"
              src="/images/logo/logo-dark.svg"
              alt="E-Dukan"
            />
          </>
        ) : (
          <img src="/images/logo/logo-icon.svg" alt="E-Dukan" className="size-8" />
        )}
      </Link>
    </SidebarHeader>
  );
}

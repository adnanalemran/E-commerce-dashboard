import { Logo, LogoMark } from "@/components/shared/logo";
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
      <Link to="/" aria-label="E-Dukan">
        {showContent ? <Logo /> : <LogoMark className="size-9" />}
      </Link>
    </SidebarHeader>
  );
}

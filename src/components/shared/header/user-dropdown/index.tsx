import { useAuth } from "@/contexts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useTranslations } from "@/i18n";
import {
  ChevronDownIcon,
  LogOutIcon,
  UserCircleIcon,
} from "@/icons";
import { cn, getInitials } from "@/utils";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

export default function UserDropdown() {
  const t = useTranslations("userDropdown");
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const displayName = user?.name ?? "";
  const firstName = displayName.split(" ")[0];
  const contact = user?.email ?? user?.phone ?? "";

  const handleSignOut = async () => {
    await logout();
    void navigate("/signin", { replace: true });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400">
        <span className="me-3 flex size-11 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={displayName}
              className="size-11 object-cover"
            />
          ) : (
            getInitials(displayName)
          )}
        </span>

        <span className="me-1 block text-sm font-medium">{firstName}</span>

        <ChevronDownIcon
          className={cn(
            "size-5 text-gray-500 duration-200 dark:text-gray-400",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={12} className="w-65 p-3">
        <div className="px-3 py-2">
          <span className="block truncate text-sm font-medium text-gray-700 dark:text-gray-400">
            {displayName}
          </span>
          <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
            {contact}
          </span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link to="/profile" />}>
          <UserCircleIcon className="size-6" />
          {t("editProfile")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOutIcon />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

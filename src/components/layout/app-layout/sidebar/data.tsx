import { LayoutGridIcon, TagIcon, UserCircleIcon, UsersIcon } from "@/icons";
import { ADMIN_ROLES, STAFF_ROLES } from "@/utils/roles";
import type { NavItem } from "./types";

export const navItems: NavItem[] = [
  {
    icon: <LayoutGridIcon className="size-6" />,
    key: "dashboard",
    subItems: [{ key: "ecommerceHome", path: "/" }],
  },
  {
    icon: <TagIcon className="size-6" />,
    key: "catalog",
    roles: STAFF_ROLES,
    subItems: [
      { key: "categories", path: "/categories" },
      { key: "subcategories", path: "/subcategories" },
    ],
  },
  {
    icon: <UsersIcon className="size-6" />,
    key: "users",
    path: "/users",
    roles: ADMIN_ROLES,
  },
  {
    icon: <UserCircleIcon className="size-6" />,
    key: "userProfile",
    path: "/profile",
  },
];

export const othersItems: NavItem[] = [];

export const supportItems: NavItem[] = [];

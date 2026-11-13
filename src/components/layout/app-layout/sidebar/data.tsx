import {
  BoxIcon,
  BarChartIcon,
  CartIcon,
  GearIcon,
  PageIcon,
  LayoutGridIcon,
  TagIcon,
  TicketIcon,
  UserCircleIcon,
  UsersIcon,
} from "@/icons";
import { ADMIN_ROLES, STAFF_ROLES } from "@/utils/roles";
import type { NavItem } from "./types";

export const navItems: NavItem[] = [
  {
    icon: <LayoutGridIcon className="size-6" />,
    key: "dashboard",
    subItems: [{ key: "ecommerceHome", path: "/" }],
  },
  {
    icon: <CartIcon className="size-6" />,
    key: "orders",
    path: "/orders",
    roles: STAFF_ROLES,
  },
  {
    icon: <BoxIcon className="size-6" />,
    key: "products",
    path: "/products",
    roles: STAFF_ROLES,
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
    icon: <TicketIcon className="size-6" />,
    key: "marketing",
    roles: STAFF_ROLES,
    subItems: [
      { key: "coupons", path: "/coupons" },
      { key: "gifts", path: "/gifts" },
      { key: "banners", path: "/banners" },
    ],
  },
  {
    icon: <PageIcon className="size-6" />,
    key: "content",
    roles: STAFF_ROLES,
    subItems: [
      { key: "brands", path: "/brands" },
      { key: "reviews", path: "/reviews" },
      { key: "pages", path: "/pages" },
    ],
  },
  {
    icon: <BarChartIcon className="size-6" />,
    key: "reports",
    path: "/reports",
    roles: STAFF_ROLES,
  },
  {
    icon: <UsersIcon className="size-6" />,
    key: "users",
    path: "/users",
    roles: ADMIN_ROLES,
  },
  {
    icon: <GearIcon className="size-6" />,
    key: "settings",
    path: "/settings",
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

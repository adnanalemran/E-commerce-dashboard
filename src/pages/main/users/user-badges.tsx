import type { UserStatus } from "@/api/users";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/i18n";
import type { RoleName } from "@/utils/roles";

const ROLE_COLORS: Record<RoleName, "error" | "primary" | "warning" | "gray"> = {
  SUPER_ADMIN: "error",
  ADMIN: "primary",
  MANAGER: "warning",
  CUSTOMER: "gray",
};

const STATUS_COLORS: Record<UserStatus, "success" | "gray" | "warning" | "error"> = {
  ACTIVE: "success",
  INACTIVE: "gray",
  SUSPENDED: "warning",
  DELETED: "error",
};

export function RoleBadge({ role }: { role: string }) {
  const t = useTranslations("users.roles");
  const color = ROLE_COLORS[role as RoleName] ?? "gray";
  const label = role in ROLE_COLORS ? t(role) : role;

  return (
    <Badge variant="light" color={color} size="sm">
      {label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: UserStatus }) {
  const t = useTranslations("users.statuses");

  return (
    <Badge variant="light" color={STATUS_COLORS[status] ?? "gray"} size="sm">
      {t(status)}
    </Badge>
  );
}

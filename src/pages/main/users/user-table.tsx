import type { AuthUser } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale, useTranslations } from "@/i18n";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { cn, getInitials } from "@/utils";
import type { ReactNode } from "react";
import { RoleBadge, StatusBadge } from "./user-badges";

export interface UserTableProps {
  items: AuthUser[];
  isLoading: boolean;
  pageSize: number;
  currentUserId: string | undefined;
  /** Whether the signed-in admin may edit/delete this user. */
  canManage: (user: AuthUser) => boolean;
  onEdit: (user: AuthUser) => void;
  onDelete: (user: AuthUser) => void;
  emptyState: ReactNode;
}

const headCell =
  "h-11 px-4 py-3 text-start text-sm font-normal whitespace-nowrap text-gray-500 dark:text-gray-400";
const bodyCell = "px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300";
const COLUMN_COUNT = 5;

export default function UserTable({
  items,
  isLoading,
  pageSize,
  currentUserId,
  canManage,
  onEdit,
  onDelete,
  emptyState,
}: UserTableProps) {
  const t = useTranslations("users");
  const locale = useLocale();
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <ScrollArea className="w-full">
      <Table>
        <TableHeader className="border-y border-gray-100 dark:border-gray-800">
          <TableRow>
            <TableCell isHeader className={cn(headCell, "min-w-72 ps-5 sm:ps-6")}>
              {t("columns.user")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-32")}>
              {t("columns.role")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-28")}>
              {t("columns.status")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-32")}>
              {t("columns.joined")}
            </TableCell>
            <TableCell isHeader className={cn(headCell, "min-w-24 pe-5 text-end sm:pe-6")}>
              {t("columns.actions")}
            </TableCell>
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading && items.length === 0 ? (
            Array.from({ length: Math.min(pageSize, 5) }, (_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell className={cn(bodyCell, "ps-5 sm:ps-6")}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full bg-gray-100 dark:bg-white/5" />
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-32 bg-gray-100 dark:bg-white/5" />
                      <Skeleton className="h-3 w-40 bg-gray-100 dark:bg-white/5" />
                    </div>
                  </div>
                </TableCell>
                {Array.from({ length: COLUMN_COUNT - 1 }, (_, cell) => (
                  <TableCell key={cell} className={bodyCell}>
                    <Skeleton className="h-3.5 w-16 bg-gray-100 dark:bg-white/5" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="px-5 py-12 sm:px-6">
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            items.map((user) => {
              const isSelf = user.id === currentUserId;
              const manageable = canManage(user);

              return (
                <TableRow key={user.id}>
                  <TableCell className={cn(bodyCell, "ps-5 sm:ps-6")}>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        ) : (
                          getInitials(user.name)
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-medium text-gray-800 dark:text-white/90">
                          <span className="truncate">{user.name}</span>
                          {isSelf && (
                            <Badge variant="light" color="info" size="sm">
                              {t("you")}
                            </Badge>
                          )}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {[user.email, user.phone].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className={bodyCell}>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => <RoleBadge key={role} role={role} />)
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className={bodyCell}>
                    <StatusBadge status={user.status} />
                  </TableCell>

                  <TableCell className={cn(bodyCell, "whitespace-nowrap")}>
                    {dateFormat.format(new Date(user.createdAt))}
                  </TableCell>

                  <TableCell className={cn(bodyCell, "pe-5 sm:pe-6")}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!manageable}
                        onClick={() => onEdit(user)}
                        aria-label={t("actions.edit", { name: user.name })}
                        className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!manageable || isSelf}
                        onClick={() => onDelete(user)}
                        aria-label={t("actions.delete", { name: user.name })}
                        className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        <TrashBinIcon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

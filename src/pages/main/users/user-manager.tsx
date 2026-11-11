import type { AuthUser } from "@/api/types";
import type { UserStatus } from "@/api/users";
import TablePagination from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTranslations } from "@/i18n";
import { PlusIcon, SearchIcon } from "@/icons";
import { cn } from "@/utils";
import { getApiErrorMessage } from "@/utils/form-errors";
import type { RoleName } from "@/utils/roles";
import { useState } from "react";
import DeleteUserDialog from "./delete-user-dialog";
import { useUserList } from "./use-users";
import UserFormDialog from "./user-form-dialog";
import UserTable from "./user-table";

const PAGE_SIZE = 10;
const ALL = "all";
const ROLE_TABS: (RoleName | typeof ALL)[] = [ALL, "ADMIN", "MANAGER", "CUSTOMER"];
const STATUS_FILTERS: (UserStatus | typeof ALL)[] = [
  ALL,
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
];

/** Searchable, paginated user list with create / edit / role / status / delete. */
export default function UserManager() {
  const t = useTranslations("users");
  const { user: currentUser } = useAuth();
  const isSuperAdmin = Boolean(currentUser?.roles.includes("SUPER_ADMIN"));

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [roleFilter, setRoleFilter] = useState<RoleName | typeof ALL>(ALL);
  const [statusFilter, setStatusFilter] = useState<UserStatus | typeof ALL>(ALL);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const { data, error, isLoading } = useUserList(
    {
      role: roleFilter === ALL ? undefined : roleFilter,
      status: statusFilter === ALL ? undefined : statusFilter,
      search: debouncedSearch || undefined,
      page,
      limit: PAGE_SIZE,
    },
    reloadKey,
  );

  const [formState, setFormState] = useState<{
    open: boolean;
    user: AuthUser | null;
  }>({ open: false, user: null });
  const [deleteTarget, setDeleteTarget] = useState<AuthUser | null>(null);

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const isFiltered =
    Boolean(debouncedSearch) || roleFilter !== ALL || statusFilter !== ALL;

  // Mirrors the backend rules: only super admins can grant or manage SUPER_ADMIN.
  const assignableRoles: RoleName[] = isSuperAdmin
    ? ["SUPER_ADMIN", "ADMIN", "MANAGER", "CUSTOMER"]
    : ["ADMIN", "MANAGER", "CUSTOMER"];
  const canManage = (user: AuthUser) =>
    isSuperAdmin || !user.roles.includes("SUPER_ADMIN");

  const reload = () => setReloadKey((key) => key + 1);
  const resetPage = () => setPage(1);

  const handleSaved = (close: boolean) => {
    if (close) setFormState((prev) => ({ ...prev, open: false }));
    reload();
  };

  const handleDeleted = () => {
    setDeleteTarget(null);
    if (items.length === 1 && page > 1) setPage(page - 1);
    else reload();
  };

  const statusItems = STATUS_FILTERS.map((status) => ({
    value: status,
    label: status === ALL ? t("filters.allStatuses") : t(`statuses.${status}`),
  }));

  const emptyState = (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
      <p className="font-medium text-gray-800 dark:text-white/90">
        {isFiltered ? t("noResults") : t("empty")}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isFiltered ? t("noResultsHint") : t("emptyDescription")}
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("listTitle")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <InputGroup className="h-10 sm:w-64">
              <InputGroupAddon align="inline-start">
                <SearchIcon className="size-5 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPage();
                }}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
              />
            </InputGroup>

            <Select
              items={statusItems}
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter((value as UserStatus | null) ?? ALL);
                resetPage();
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-10 sm:w-44"
                aria-label={t("filters.status")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="h-10 shrink-0"
              onClick={() => setFormState({ open: true, user: null })}
            >
              <PlusIcon className="size-4" />
              {t("add")}
            </Button>
          </div>
        </div>

        <div
          role="group"
          aria-label={t("filters.role")}
          className="flex gap-1 overflow-x-auto px-5 pb-4 sm:px-6"
        >
          {ROLE_TABS.map((role) => {
            const active = roleFilter === role;
            return (
              <button
                key={role}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setRoleFilter(role);
                  resetPage();
                }}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300",
                )}
              >
                {role === ALL ? t("filters.allRoles") : t(`tabs.${role}`)}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-3 border-t border-gray-100 px-5 py-12 text-center dark:border-gray-800">
            <p className="font-medium text-gray-800 dark:text-white/90">
              {t("errors.loadFailed")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getApiErrorMessage(error, {
                network: t("errors.network"),
                unexpected: t("errors.unexpected"),
              })}
            </p>
            <Button variant="outline" size="sm" onClick={reload}>
              {t("errors.retry")}
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "transition-opacity",
              isLoading && items.length > 0 && "pointer-events-none opacity-60",
            )}
            aria-busy={isLoading}
          >
            <UserTable
              items={items}
              isLoading={isLoading}
              pageSize={PAGE_SIZE}
              currentUserId={currentUser?.id}
              canManage={canManage}
              onEdit={(user) => setFormState({ open: true, user })}
              onDelete={setDeleteTarget}
              emptyState={emptyState}
            />
          </div>
        )}

        {pagination && !error && (
          <TablePagination
            page={pagination.page}
            totalPages={Math.max(1, pagination.totalPages)}
            total={pagination.total}
            pageSize={pagination.limit}
            onPageChange={setPage}
          />
        )}
      </div>

      <UserFormDialog
        open={formState.open}
        onOpenChange={(open) => setFormState((prev) => ({ ...prev, open }))}
        user={formState.user}
        isSelf={formState.user?.id === currentUser?.id}
        assignableRoles={assignableRoles}
        onSaved={handleSaved}
      />

      <DeleteUserDialog
        user={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

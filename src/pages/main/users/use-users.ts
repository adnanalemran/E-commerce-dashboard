import type { Paginated } from "@/api/categories";
import type { AuthUser } from "@/api/types";
import { usersApi, type ListUsersParams } from "@/api/users";
import { useEffect, useState } from "react";

interface ListResult {
  key: string;
  data?: Paginated<AuthUser>;
  error?: unknown;
}

/**
 * Fetches a page of users. Previous results stay visible while the next
 * request is in flight; bump `reloadKey` to refetch the same page.
 */
export function useUserList(
  { role, status, search, page, limit }: ListUsersParams,
  reloadKey: number,
) {
  const key = JSON.stringify([role, status, search, page, limit, reloadKey]);
  const [result, setResult] = useState<ListResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    usersApi
      .list({ role, status, search, page, limit }, controller.signal)
      .then((data) => setResult({ key, data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ key, error });
      });

    return () => controller.abort();
  }, [key, role, status, search, page, limit]);

  const isCurrent = result?.key === key;

  return {
    data: result?.data,
    error: isCurrent ? result.error : undefined,
    isLoading: !isCurrent,
  };
}

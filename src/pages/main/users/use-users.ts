import { queryKeys } from "@/api/query-client";
import { usersApi, type ListUsersParams } from "@/api/users";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * A page of users. Previous results stay visible while the next page or
 * filter loads (`isLoading` is true until the current params have data).
 */
export function useUserList(params: ListUsersParams) {
  const query = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: ({ signal }) => usersApi.list(params, signal),
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data,
    error: query.isPlaceholderData ? undefined : (query.error ?? undefined),
    isLoading: query.isPending || query.isPlaceholderData,
  };
}

/** Refetch every cached user list. */
export function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
}

import { couponsApi, type ListCouponsParams } from "@/api/coupons";
import { queryKeys } from "@/api/query-client";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useCouponList(params: ListCouponsParams) {
  const query = useQuery({
    queryKey: queryKeys.coupons.list(params),
    queryFn: ({ signal }) => couponsApi.list(params, signal),
    placeholderData: keepPreviousData,
  });
  return {
    data: query.data,
    error: query.isPlaceholderData ? undefined : (query.error ?? undefined),
    isLoading: query.isPending || query.isPlaceholderData,
    refetch: () => void query.refetch(),
  };
}

export function useInvalidateCoupons() {
  const queryClient = useQueryClient();
  return useCallback(() => void queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all }), [queryClient]);
}

import {
  ordersApi,
  type ListOrdersParams,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from "@/api/orders";
import { queryKeys } from "@/api/query-client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/** A page of orders (+ counts per status). Previous page stays visible while loading. */
export function useOrderList(params: ListOrdersParams) {
  const query = useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: ({ signal }) => ordersApi.list(params, signal),
    placeholderData: keepPreviousData,
    // New orders arrive from the storefront; keep the list reasonably fresh.
    refetchInterval: 60_000,
  });

  return {
    data: query.data,
    error: query.isPlaceholderData ? undefined : (query.error ?? undefined),
    isLoading: query.isPending || query.isPlaceholderData,
    refetch: () => void query.refetch(),
  };
}

export function useOrderStats() {
  return useQuery({
    queryKey: queryKeys.orders.stats,
    queryFn: ({ signal }) => ordersApi.stats(signal),
    refetchInterval: 60_000,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ""),
    queryFn: ({ signal }) => ordersApi.get(id!, signal),
    enabled: Boolean(id),
  });
}

/**
 * Status and payment changes. On success the fresh order is cached, and lists,
 * stats and product stock (cancel/return restocks) are refetched.
 */
export function useOrderMutations(id: string) {
  const queryClient = useQueryClient();

  const onSuccess = (order: Order) => {
    queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
    void queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats });
    void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  };

  const setStatus = useMutation({
    mutationFn: ({ status, note }: { status: OrderStatus; note?: string }) =>
      ordersApi.setStatus(id, status, note),
    onSuccess,
  });

  const setPaymentStatus = useMutation({
    mutationFn: (paymentStatus: PaymentStatus) => ordersApi.setPaymentStatus(id, paymentStatus),
    onSuccess,
  });

  return { setStatus, setPaymentStatus };
}

import {
  ordersApi,
  type ListOrdersParams,
  type Order,
  type OrderCustomerInput,
  type OrderGiftAction,
  type OrderItemInput,
  type OrderStatus,
  type PaymentStatus,
} from "@/api/orders";
import { productsApi, type AdminListProductsParams } from "@/api/products";
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
 * Server-priced preview of an item edit (totals, delivery, coupon, stock problems).
 * Off while `items` is empty; the last result stays visible while the next loads.
 */
export function useOrderItemsPreview(id: string, items: OrderItemInput[], gift: OrderGiftAction) {
  return useQuery({
    queryKey: queryKeys.orders.itemsPreview(id, items, gift),
    queryFn: ({ signal }) => ordersApi.previewItems(id, items, gift, signal),
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

/** Districts and Dhaka areas for the delivery form; they never change while the app runs. */
export function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations,
    queryFn: ({ signal }) => ordersApi.locations(signal),
    staleTime: Infinity,
  });
}

/** Active products matching `search` (at least 2 characters), for adding to an order. */
export function useProductSearch(search: string) {
  const params: AdminListProductsParams = { search, status: "ACTIVE", limit: 6 };
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: ({ signal }) => productsApi.list(params, signal),
    enabled: search.length >= 2,
    placeholderData: keepPreviousData,
  });
}

/**
 * Status, payment and item changes. On success the fresh order is cached, and lists,
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

  const updateItems = useMutation({
    mutationFn: ({ items, gift, note }: { items: OrderItemInput[]; gift: OrderGiftAction; note?: string }) =>
      ordersApi.updateItems(id, items, gift, note),
    onSuccess,
  });

  const updateCustomer = useMutation({
    mutationFn: (input: OrderCustomerInput) => ordersApi.updateCustomer(id, input),
    onSuccess,
  });

  return { setStatus, setPaymentStatus, updateItems, updateCustomer };
}

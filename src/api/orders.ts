import type { Paginated } from "./categories";
import { apiRequest } from "./client";

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type PaymentMethod = "COD" | "BKASH" | "NAGAD";
export type DeliveryZone = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string | null;
  image: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
}

export interface OrderEvent {
  id: string;
  status: OrderStatus;
  note: string | null;
  actorId: string | null;
  actorName?: string | null;
  createdAt: string;
}

/** Mirrors `OrderService.format` in the backend. */
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  deliveryZone: DeliveryZone;
  note: string | null;
  cancelReason: string | null;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  itemCount: number;
  items: OrderItem[];
  events: OrderEvent[];
  /** Statuses this order may move to next. */
  allowedTransitions: OrderStatus[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  pending: number;
  last30Days: { date: string; orders: number; revenue: number }[];
}

export interface ListOrdersParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  search?: string;
  page?: number;
  limit?: number;
}

export type OrderCounts = Partial<Record<OrderStatus, number>> & { all: number };

function toQueryString(params: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/** Order management (`/admin/orders`, admins & managers). */
export const ordersApi = {
  list: (params: ListOrdersParams = {}, signal?: AbortSignal) =>
    apiRequest<Paginated<Order> & { counts: OrderCounts }>(`/admin/orders${toQueryString(params)}`, {
      signal,
    }),

  stats: (signal?: AbortSignal) => apiRequest<OrderStats>("/admin/orders/stats", { signal }),

  get: (id: string, signal?: AbortSignal) =>
    apiRequest<Order>(`/admin/orders/${id}`, { signal }),

  setStatus: (id: string, status: OrderStatus, note?: string) =>
    apiRequest<Order>(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: { status, ...(note ? { note } : {}) },
    }),

  setPaymentStatus: (id: string, paymentStatus: PaymentStatus) =>
    apiRequest<Order>(`/admin/orders/${id}/payment`, {
      method: "PATCH",
      body: { paymentStatus },
    }),
};

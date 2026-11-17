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
export type DeliveryZone = "INSIDE_DHAKA" | "DHAKA_SUBURB" | "OUTSIDE_DHAKA";

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
  /** Free gift added by a gift rule. */
  isGift: boolean;
}

export interface OrderEvent {
  id: string;
  status: OrderStatus;
  note: string | null;
  actorId: string | null;
  actorName?: string | null;
  createdAt: string;
}

export interface PaymentAttempt {
  id: string;
  provider: "BKASH";
  paymentId: string;
  trxId: string | null;
  amount: number;
  status: "INITIATED" | "COMPLETED" | "FAILED" | "CANCELLED";
  payer: string | null;
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
  district: string | null;
  area: string | null;
  deliveryZone: DeliveryZone;
  couponCode: string | null;
  courier: string | null;
  consignmentId: string | null;
  trackingCode: string | null;
  note: string | null;
  cancelReason: string | null;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  itemCount: number;
  items: OrderItem[];
  events: OrderEvent[];
  /** Online payment attempts (detail endpoint only). */
  payments?: PaymentAttempt[];
  /** Statuses this order may move to next. */
  allowedTransitions: OrderStatus[];
  /** Staff may still change the items (before shipping, unpaid, no courier booking). */
  itemsEditable: boolean;
  /** Staff may still correct contact and delivery details (before shipping, no courier booking). */
  customerEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  pending: number;
  /** Distinct phone numbers that have ever ordered. */
  customers: number;
  last30Days: { date: string; orders: number; revenue: number }[];
  /** Best sellers by quantity over the last 30 days. */
  topProducts: { slug: string; name: string; quantity: number; revenue: number }[];
  lowStock: {
    threshold: number;
    count: number;
    items: { variantId: string; productId: string; productName: string; variantName: string; stock: number }[];
  };
}

/** One line of the new item list sent when staff edit an order. */
export interface OrderItemInput {
  variantId: string;
  quantity: number;
}

/** A line that can't be saved as requested (mirrors `UnavailableLine`). */
export interface OrderItemProblem {
  variantId: string;
  productName: string | null;
  variantName: string | null;
  reason: "NOT_FOUND" | "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";
  /** Most units this order can have of the variant. */
  available: number;
  requested: number;
}

/** A paid line after an edit (mirrors `EditedLine`). */
export interface EditedOrderLine {
  itemId: string | null;
  variantId: string;
  productId: string | null;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string | null;
  image: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  previousQuantity: number;
  lineTotal: number;
  available: number | null;
}

/** Result of `POST /admin/orders/:id/items/preview` (nothing is saved). */
export interface OrderItemsPreview {
  items: EditedOrderLine[];
  problems: OrderItemProblem[];
  changed: boolean;
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
}

/** Body of `PATCH /admin/orders/:id/customer` (same rules as checkout). */
export interface OrderCustomerInput {
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  district: string;
  /** Required (a known area) when the district is Dhaka; free text otherwise. */
  area?: string;
  note?: string;
}

/** `GET /store/locations`: districts and Dhaka areas offered at checkout. */
export interface DeliveryLocations {
  districts: { name: string; bn: string; division: string }[];
  dhakaAreas: { city: string[]; suburb: string[] };
  suburbDistricts: string[];
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

  /** New totals and stock problems for an item edit, without saving. */
  previewItems: (id: string, items: OrderItemInput[], signal?: AbortSignal) =>
    apiRequest<OrderItemsPreview>(`/admin/orders/${id}/items/preview`, {
      method: "POST",
      body: { items },
      signal,
    }),

  /** Replaces the order's paid lines (quantities, added and removed products). */
  updateItems: (id: string, items: OrderItemInput[], note?: string) =>
    apiRequest<Order>(`/admin/orders/${id}/items`, {
      method: "PUT",
      body: { items, ...(note ? { note } : {}) },
    }),

  /** Correct the customer's contact and delivery details; delivery is repriced if the zone changes. */
  updateCustomer: (id: string, input: OrderCustomerInput) =>
    apiRequest<Order>(`/admin/orders/${id}/customer`, { method: "PATCH", body: input }),

  locations: (signal?: AbortSignal) => apiRequest<DeliveryLocations>("/store/locations", { signal }),

  setPaymentStatus: (id: string, paymentStatus: PaymentStatus) =>
    apiRequest<Order>(`/admin/orders/${id}/payment`, {
      method: "PATCH",
      body: { paymentStatus },
    }),
};

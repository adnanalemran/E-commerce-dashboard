import type { DeliveryLocations, DeliveryZone, OrderCustomerInput } from "@/api/orders";
import type { Translator } from "@/i18n";
import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Same rule as the backend's `bdPhoneSchema` (01XXXXXXXXX, optional +88). */
const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

/** `t` must be scoped to the `orders` namespace. Mirrors `updateOrderCustomerSchema` in the backend. */
export function createCustomerSchema(t: Translator) {
  return z
    .object({
      customerName: z
        .string()
        .trim()
        .min(2, t("editCustomer.validation.name"))
        .max(100, t("editCustomer.validation.nameMax")),
      phone: z
        .string()
        .trim()
        .refine((v) => bdPhoneRegex.test(v.replace(/[\s-]/g, "")), t("editCustomer.validation.phone")),
      email: z
        .string()
        .trim()
        .refine((v) => v === "" || emailRegex.test(v), t("editCustomer.validation.email")),
      address: z
        .string()
        .trim()
        .min(8, t("editCustomer.validation.address"))
        .max(500, t("editCustomer.validation.addressMax")),
      district: z.string().min(1, t("editCustomer.validation.district")),
      area: z.string().trim().max(60, t("editCustomer.validation.areaMax")),
      note: z.string().trim().max(500, t("editCustomer.validation.noteMax")),
    })
    .refine((data) => data.district !== "Dhaka" || data.area !== "", {
      path: ["area"],
      message: t("editCustomer.validation.dhakaArea"),
    });
}

export type CustomerFormValues = z.infer<ReturnType<typeof createCustomerSchema>>;

export function toCustomerInput(values: CustomerFormValues): OrderCustomerInput {
  return {
    customerName: values.customerName,
    phone: values.phone,
    address: values.address,
    district: values.district,
    ...(values.email ? { email: values.email } : {}),
    ...(values.area ? { area: values.area } : {}),
    ...(values.note ? { note: values.note } : {}),
  };
}

/** Same as the backend's `zoneFor`: the server decides the zone, this only previews it. */
export function zoneFor(locations: DeliveryLocations, district: string, area: string): DeliveryZone {
  if (district === "Dhaka") {
    return locations.dhakaAreas.suburb.includes(area) ? "DHAKA_SUBURB" : "INSIDE_DHAKA";
  }
  if (locations.suburbDistricts.includes(district)) return "DHAKA_SUBURB";
  return "OUTSIDE_DHAKA";
}

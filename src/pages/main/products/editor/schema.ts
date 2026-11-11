import type { Product, ProductInput, ProductStatus } from "@/api/products";
import type { Translator } from "@/i18n";
import { z } from "zod";

const MONEY = /^\d{1,8}(\.\d{1,2})?$/;
const WHOLE = /^\d{1,7}$/;

/** `t` must be scoped to the `products` namespace. */
export function createProductFormSchema(t: Translator) {
  const variant = z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1, t("validation.variantName")).max(50, t("validation.variantNameMax")),
    sku: z.string().trim().max(64, t("validation.skuMax")),
    price: z.string().trim().regex(MONEY, t("validation.price")),
    compareAtPrice: z
      .string()
      .trim()
      .refine((value) => value === "" || MONEY.test(value), t("validation.price")),
    stock: z.string().trim().regex(WHOLE, t("validation.stock")),
  });

  return z
    .object({
      name: z.string().trim().min(2, t("validation.nameMin")).max(200, t("validation.nameMax")),
      shortDescription: z.string().max(500, t("validation.shortDescriptionMax")),
      description: z.string().max(20_000, t("validation.descriptionMax")),
      status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
      categoryId: z.string(),
      isFeatured: z.boolean(),
      isBestSelling: z.boolean(),
      isNewArrival: z.boolean(),
      tags: z.string(),
      orderNo: z.string().trim().refine((v) => v === "" || WHOLE.test(v), t("validation.orderNo")),
      variants: z.array(variant).min(1, t("validation.variantsRequired")),
    })
    .superRefine((data, ctx) => {
      const names = new Set<string>();
      const skus = new Set<string>();
      data.variants.forEach((v, index) => {
        if (v.compareAtPrice !== "" && Number(v.compareAtPrice) <= Number(v.price)) {
          ctx.addIssue({
            code: "custom",
            message: t("validation.compareAtPrice"),
            path: ["variants", index, "compareAtPrice"],
          });
        }
        const name = v.name.trim().toLowerCase();
        if (name && names.has(name)) {
          ctx.addIssue({ code: "custom", message: t("validation.variantNameUnique"), path: ["variants", index, "name"] });
        }
        names.add(name);
        const sku = v.sku.trim().toLowerCase();
        if (sku && skus.has(sku)) {
          ctx.addIssue({ code: "custom", message: t("validation.skuUnique"), path: ["variants", index, "sku"] });
        }
        if (sku) skus.add(sku);
      });
    });
}

export type ProductFormValues = z.infer<ReturnType<typeof createProductFormSchema>>;

export const NO_CATEGORY = "none";

export const emptyVariant = (): ProductFormValues["variants"][number] => ({
  name: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
});

export function toFormValues(product: Product | null): ProductFormValues {
  if (!product) {
    return {
      name: "",
      shortDescription: "",
      description: "",
      status: "DRAFT",
      categoryId: NO_CATEGORY,
      isFeatured: false,
      isBestSelling: false,
      isNewArrival: false,
      tags: "",
      orderNo: "",
      variants: [emptyVariant()],
    };
  }
  return {
    name: product.name,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    status: product.status,
    categoryId: product.categoryId ?? NO_CATEGORY,
    isFeatured: product.isFeatured,
    isBestSelling: product.isBestSelling,
    isNewArrival: product.isNewArrival,
    tags: product.tags.join(", "),
    orderNo: String(product.orderNo),
    variants: product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku ?? "",
      price: String(v.price),
      compareAtPrice: v.compareAtPrice === null ? "" : String(v.compareAtPrice),
      stock: String(v.stock),
    })),
  };
}

export function toProductInput(values: ProductFormValues): ProductInput {
  return {
    name: values.name.trim(),
    shortDescription: values.shortDescription.trim() || null,
    description: values.description.trim() || null,
    status: values.status as ProductStatus,
    categoryId: values.categoryId === NO_CATEGORY ? null : values.categoryId,
    isFeatured: values.isFeatured,
    isBestSelling: values.isBestSelling,
    isNewArrival: values.isNewArrival,
    tags: values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    orderNo: values.orderNo === "" ? undefined : Number(values.orderNo),
    variants: values.variants.map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      name: v.name.trim(),
      sku: v.sku.trim() || null,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice === "" ? null : Number(v.compareAtPrice),
      stock: Number(v.stock),
    })),
  };
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { cn } from "@/utils";
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { emptyVariant, type ProductFormValues } from "./schema";

const COLUMNS = ["name", "sku", "price", "compareAtPrice", "stock"] as const;

/** Editable list of variants (e.g. 500gm / 1kg), each with its own price and stock. */
export default function VariantsEditor({
  control,
  register,
  errors,
}: {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}) {
  const t = useTranslations("products.variants");
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const values = useWatch({ control, name: "variants" });

  const discount = (index: number) => {
    const price = Number(values?.[index]?.price);
    const compareAt = Number(values?.[index]?.compareAtPrice);
    return price > 0 && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  };

  const listError = errors.variants?.root?.message ?? errors.variants?.message;

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const rowErrors = errors.variants?.[index];
        const save = discount(index);

        return (
          <div
            key={field.id}
            className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("label", { number: index + 1 })}
                {index === 0 && (
                  <span className="ms-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                    {t("primary")}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {save > 0 && (
                  <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-500/15 dark:text-green-500">
                    {t("save", { percent: save })}
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  aria-label={t("remove", { number: index + 1 })}
                  className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <TrashBinIcon className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {COLUMNS.map((column) => {
                const error = rowErrors?.[column]?.message;
                const inputId = `variant-${field.id}-${column}`;
                const isNumber = column !== "name" && column !== "sku";
                return (
                  <div
                    key={column}
                    className={cn("flex min-w-0 flex-col gap-1.5", column === "name" && "col-span-2 sm:col-span-1")}
                  >
                    <label
                      htmlFor={inputId}
                      className="text-xs font-medium text-gray-600 dark:text-gray-400"
                    >
                      {t(`fields.${column}`)}
                      {(column === "name" || column === "price") && (
                        <span className="text-red-500"> *</span>
                      )}
                    </label>
                    <Input
                      id={inputId}
                      {...register(`variants.${index}.${column}`)}
                      inputMode={isNumber ? (column === "stock" ? "numeric" : "decimal") : undefined}
                      placeholder={t(`placeholders.${column}`)}
                      aria-invalid={error ? "true" : undefined}
                      className="h-10"
                    />
                    {error && (
                      <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {listError && (
        <p role="alert" className="text-sm text-red-500 dark:text-red-400">
          {listError}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(emptyVariant())}
        disabled={fields.length >= 30}
      >
        <PlusIcon className="size-4" />
        {t("add")}
      </Button>
    </div>
  );
}

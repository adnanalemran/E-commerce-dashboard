import { productsApi, type Product } from "@/api/products";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/i18n";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useState } from "react";

export interface DeleteProductDialogProps {
  /** Product to delete; `null` closes the dialog. */
  product: Pick<Product, "id" | "name"> | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteProductDialog({
  product,
  onOpenChange,
  onDeleted,
}: DeleteProductDialogProps) {
  return (
    <Dialog open={product !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl p-6 sm:max-w-md sm:p-8">
        {product && <DeleteContent product={product} onDeleted={onDeleted} />}
      </DialogContent>
    </Dialog>
  );
}

function DeleteContent({
  product,
  onDeleted,
}: {
  product: Pick<Product, "id" | "name">;
  onDeleted: () => void;
}) {
  const t = useTranslations("products");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await productsApi.remove(product.id);
      onDeleted();
    } catch (err) {
      setError(
        getApiErrorMessage(err, {
          network: t("errors.network"),
          unexpected: t("errors.unexpected"),
        }),
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DialogHeader className="gap-2 pe-12 text-start">
        <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {t("delete.title", { name: product.name })}
        </DialogTitle>
        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
          {t("delete.description")}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <p role="alert" className="text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}

      <DialogFooter className="mx-0 mb-0 gap-3 p-0 pt-2 sm:justify-end">
        <DialogClose
          render={
            <Button variant="outline" type="button" disabled={isDeleting}>
              {t("actions.cancel")}
            </Button>
          }
        />
        <Button variant="destructive" type="button" disabled={isDeleting} onClick={handleDelete}>
          {isDeleting ? t("delete.deleting") : t("delete.confirm")}
        </Button>
      </DialogFooter>
    </>
  );
}

import {
  MAX_PRODUCT_IMAGES,
  productsApi,
  type Product,
  type ProductImage,
} from "@/api/products";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "@/i18n";
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { getApiErrorMessage } from "@/utils/form-errors";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

export interface QueuedImage {
  key: string;
  file: File;
  previewUrl: string;
}

export interface ImagesManagerProps {
  /** Saved product: changes are applied immediately. `null` while creating. */
  productId: string | null;
  images: ProductImage[];
  onProductChange: (product: Product) => void;
  /** Files picked before the product exists; uploaded after it is created. */
  queued: QueuedImage[];
  onQueuedChange: (queued: QueuedImage[]) => void;
}

interface Tile {
  key: string;
  url: string;
  imageId?: string;
}

export default function ImagesManager({
  productId,
  images,
  onProductChange,
  queued,
  onQueuedChange,
}: ImagesManagerProps) {
  const t = useTranslations("products.images");
  const tProducts = useTranslations("products");
  const inputRef = useRef<HTMLInputElement>(null);
  const queuedRef = useRef(queued);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queuedRef.current = queued;
  }, [queued]);

  // Release preview URLs when the editor unmounts.
  useEffect(
    () => () => queuedRef.current.forEach((q) => URL.revokeObjectURL(q.previewUrl)),
    [],
  );

  const tiles: Tile[] = productId
    ? images.map((image) => ({ key: image.id, url: image.url, imageId: image.id }))
    : queued.map((q) => ({ key: q.key, url: q.previewUrl }));
  const remaining = MAX_PRODUCT_IMAGES - tiles.length;

  const run = async (task: () => Promise<Product>) => {
    setBusy(true);
    setError(null);
    try {
      onProductChange(await task());
    } catch (err) {
      setError(
        getApiErrorMessage(err, {
          network: tProducts("errors.network"),
          unexpected: tProducts("errors.unexpected"),
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;

    if (picked.some((file) => !ACCEPTED.includes(file.type))) return setError(t("type"));
    if (picked.some((file) => file.size > MAX_BYTES)) return setError(t("size"));
    if (picked.length > remaining) return setError(t("limit", { max: MAX_PRODUCT_IMAGES }));
    setError(null);

    if (productId) {
      void run(() => productsApi.uploadImages(productId, picked));
    } else {
      onQueuedChange([
        ...queued,
        ...picked.map((file) => ({
          key: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ]);
    }
  };

  const handleRemove = (index: number) => {
    if (productId) {
      const imageId = tiles[index]?.imageId;
      if (imageId) void run(() => productsApi.removeImage(productId, imageId));
      return;
    }
    const target = queued[index];
    if (target) URL.revokeObjectURL(target.previewUrl);
    onQueuedChange(queued.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const to = index + direction;
    if (to < 0 || to >= tiles.length) return;
    const swap = <T,>(list: T[]) => {
      const next = [...list];
      [next[index], next[to]] = [next[to]!, next[index]!];
      return next;
    };
    if (productId) {
      const order = swap(images.map((image) => image.id));
      void run(() => productsApi.reorderImages(productId, order));
    } else {
      onQueuedChange(swap(queued));
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {tiles.map((tile, index) => (
          <div
            key={tile.key}
            className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/3"
          >
            <img src={tile.url} alt="" className="size-full object-cover" />
            {index === 0 && (
              <span className="absolute inset-s-2 top-2 rounded-md bg-gray-900/70 px-2 py-0.5 text-xs font-medium text-white">
                {t("cover")}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-linear-to-t from-black/60 to-transparent p-1.5">
              <div className="flex gap-1">
                <IconAction
                  label={t("moveEarlier")}
                  disabled={busy || index === 0}
                  onClick={() => handleMove(index, -1)}
                >
                  <ArrowLeftIcon className="size-4 rtl:rotate-180" />
                </IconAction>
                <IconAction
                  label={t("moveLater")}
                  disabled={busy || index === tiles.length - 1}
                  onClick={() => handleMove(index, 1)}
                >
                  <ArrowRightIcon className="size-4 rtl:rotate-180" />
                </IconAction>
              </div>
              <IconAction label={t("remove")} disabled={busy} onClick={() => handleRemove(index)}>
                <TrashBinIcon className="size-4" />
              </IconAction>
            </div>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 disabled:cursor-wait dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500/60"
          >
            {busy ? <Spinner className="size-6" /> : <PlusIcon className="size-6" />}
            {t("add")}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t("hint", { max: MAX_PRODUCT_IMAGES })}
        {!productId && queued.length > 0 && ` ${t("queuedHint")}`}
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={handleFiles}
      />
    </div>
  );
}

function IconAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon-xs"
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="size-7 rounded-md bg-white/90 text-gray-700 hover:bg-white disabled:opacity-40 dark:bg-gray-900/90 dark:text-gray-200"
    >
      {children}
    </Button>
  );
}

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import CategoryThumb from "./category-thumb";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "./types";

export interface ImageFieldValue {
  /** Newly selected file, if any. */
  file: File | null;
  /** The existing image was removed. */
  removed: boolean;
}

export interface ImageFieldProps {
  id?: string;
  /** Current image URL when editing. */
  initialUrl: string | null;
  onChange: (value: ImageFieldValue) => void;
  disabled?: boolean;
}

/** Image picker with preview; validates type and size client-side. */
export default function ImageField({
  id,
  initialUrl,
  onChange,
  disabled,
}: ImageFieldProps) {
  const t = useTranslations("catalog.form");
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  const replaceObjectUrl = (url: string | null) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(t("imageType"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t("imageSize"));
      return;
    }

    setError(null);
    const url = URL.createObjectURL(file);
    replaceObjectUrl(url);
    setPreview(url);
    onChange({ file, removed: false });
  };

  const handleRemove = () => {
    replaceObjectUrl(null);
    setPreview(null);
    setError(null);
    onChange({ file: null, removed: Boolean(initialUrl) });
  };

  return (
    <div className="flex items-center gap-4">
      <CategoryThumb
        src={preview}
        alt={t("imagePreview")}
        className="size-20 rounded-xl border-dashed"
      />

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {preview ? t("changeImage") : t("uploadImage")}
          </Button>
          {preview && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={handleRemove}
              className="text-red-500 hover:text-red-600 dark:text-red-400"
            >
              {t("removeImage")}
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("imageHint")}
        </p>
        {error && (
          <p role="alert" className="text-xs text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={handleFileChange}
      />
    </div>
  );
}

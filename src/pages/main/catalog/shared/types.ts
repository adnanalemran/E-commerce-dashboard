/** `root` manages top-level categories, `sub` manages subcategories. */
export type CategoryLevel = "root" | "sub";

export const PAGE_SIZE = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

import { ApiError } from "@/api/client";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/** User-facing message for a failed API call. */
export function getApiErrorMessage(
  error: unknown,
  messages: { network: string; unexpected: string },
): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return messages.network;
    if (error.message) return error.message;
  }
  return messages.unexpected;
}

/**
 * Copies backend validation errors (`[{ field, message }]`) onto form fields.
 * Returns `true` when at least one error was mapped to a field.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: Record<string, Path<T>>,
): boolean {
  if (!(error instanceof ApiError)) return false;

  let applied = false;
  for (const { field, message } of error.fieldErrors) {
    const target = fieldMap[field];
    if (target) {
      setError(target, { type: "server", message }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}

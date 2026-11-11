/** Bangladeshi Taka, e.g. "৳1,890" or "৳950.50". */
export function formatTaka(amount: number, locale: string): string {
  return `৳${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount)}`;
}

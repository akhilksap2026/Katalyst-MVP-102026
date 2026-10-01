/**
 * Locale-first formatters for product values. The caller must supply the active
 * i18next locale; this module intentionally has no fixed/default locale.
 */
export type FormatLocale = string
export type DateTimeInput = Date | number | string

function toDateInput(value: DateTimeInput): Date | number {
  return typeof value === "string" ? new Date(value) : value
}

export function fmtDate(
  locale: FormatLocale,
  value: DateTimeInput,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat(locale, options).format(toDateInput(value))
}

export function fmtTime(
  locale: FormatLocale,
  value: DateTimeInput,
  options: Intl.DateTimeFormatOptions = { timeStyle: "short" },
): string {
  return new Intl.DateTimeFormat(locale, options).format(toDateInput(value))
}

export function fmtDateTime(
  locale: FormatLocale,
  value: DateTimeInput,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
  return new Intl.DateTimeFormat(locale, options).format(toDateInput(value))
}

export function fmtCurrency(
  locale: FormatLocale,
  value: number | bigint,
  currency: string,
  options: Omit<Intl.NumberFormatOptions, "style" | "currency"> = {},
): string {
  return new Intl.NumberFormat(locale, {
    ...options,
    style: "currency",
    currency,
  }).format(value)
}

export function fmtNumber(
  locale: FormatLocale,
  value: number | bigint,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}
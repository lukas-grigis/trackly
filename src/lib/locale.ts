/**
 * Locale-aware formatting utilities.
 * Always use navigator.language for formatting regardless of UI language choice.
 */

export function formatLocalDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat(navigator.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

export function formatLocalNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat(navigator.language, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

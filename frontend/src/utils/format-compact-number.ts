export const formatCompactNumber = (
  value: number,
  options?: {
    locale?: string;
    maximumFractionDigits?: number;
    compactThreshold?: number;
  },
): string => {
  const { locale = 'en', maximumFractionDigits = 1, compactThreshold = 1_000_000 } = options ?? {};

  if (value < compactThreshold) {
    return new Intl.NumberFormat(locale).format(value);
  }

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits,
  }).format(value);
};

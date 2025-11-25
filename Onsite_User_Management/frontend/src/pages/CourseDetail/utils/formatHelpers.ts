export const formatCurrency = (value: number | string | null | undefined): string => {
  const numericValue = Number(value || 0);
  if (Number.isNaN(numericValue)) {
    return '0';
  }
  return numericValue.toLocaleString('en-US', { minimumFractionDigits: 0 });
};


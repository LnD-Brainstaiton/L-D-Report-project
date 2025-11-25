/**
 * Format currency value
 */
export const formatCurrency = (value) => {
  const numericValue = Number(value || 0);
  if (Number.isNaN(numericValue)) {
    return '0';
  }
  return numericValue.toLocaleString('en-US', { minimumFractionDigits: 0 });
};


export function currency(value, compact = false, currencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: value > 100 ? 0 : 4,
  }).format(value || 0);
}

export function number(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value || 0);
}

export function percent(value) {
  const safe = Number(value || 0);
  return `${safe > 0 ? '+' : ''}${safe.toFixed(2)}%`;
}

export function date(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

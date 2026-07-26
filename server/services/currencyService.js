export const supportedCurrencies = [
  'usd', 'inr', 'eur', 'gbp', 'aed', 'sgd', 'jpy', 'cad', 'aud', 'chf',
  'cny', 'hkd', 'krw', 'brl', 'mxn', 'zar', 'nzd', 'sek', 'nok', 'dkk',
  'pln', 'try', 'thb', 'idr', 'myr', 'php', 'vnd', 'sar', 'ils', 'ngn',
];

export const currencyMeta = {
  usd: { code: 'USD', symbol: '$', name: 'US Dollar' },
  inr: { code: 'INR', symbol: 'Rs', name: 'Indian Rupee' },
  eur: { code: 'EUR', symbol: 'EUR', name: 'Euro' },
  gbp: { code: 'GBP', symbol: 'GBP', name: 'British Pound' },
  aed: { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  sgd: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  jpy: { code: 'JPY', symbol: 'JPY', name: 'Japanese Yen' },
  cad: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  aud: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
};

export function normalizeCurrency(currency = 'usd') {
  const normalized = String(currency).toLowerCase();
  return supportedCurrencies.includes(normalized) ? normalized : 'usd';
}

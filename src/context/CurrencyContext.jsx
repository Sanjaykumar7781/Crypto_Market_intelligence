import { useMemo, useState } from 'react';
import { currencyOptions } from '../data/currencies.js';
import { CurrencyContext } from './currencyStore.js';

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'usd');
  const selected = currencyOptions.find((option) => option.value === currency) || currencyOptions[0];

  const value = useMemo(() => ({
    currency,
    currencyCode: selected.code,
    currencyLabel: selected.label,
    setCurrency: (nextCurrency) => {
      localStorage.setItem('currency', nextCurrency);
      setCurrency(nextCurrency);
    },
  }), [currency, selected]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const currencies: Currency[] = [
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', locale: 'en-ZA' },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', locale: 'en-NG' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', locale: 'en-KE' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', locale: 'en-BW' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', locale: 'en-NA' },
];

export const getCurrency = (code: string): Currency => {
  return currencies.find(c => c.code === code) || currencies[0];
};

export const formatCurrency = (amount: number, currencyCode: string = 'ZAR'): string => {
  const currency = getCurrency(currencyCode);
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCurrencyCompact = (amount: number, currencyCode: string = 'ZAR'): string => {
  const currency = getCurrency(currencyCode);
  return `${currency.symbol}${amount.toLocaleString(currency.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Exchange rate types
export interface ExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  updatedAt: string;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  rate: number;
}

export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number
): ConversionResult => {
  const convertedAmount = amount * rate;
  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: Math.round(convertedAmount * 100) / 100,
    targetCurrency: toCurrency,
    rate,
  };
};

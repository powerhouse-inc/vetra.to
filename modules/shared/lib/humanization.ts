export const usLocalizedNumber = (num: number, decimalPlace = 0): string => {
  const value = num.toLocaleString('en-US', {
    currency: 'USD',
    currencyDisplay: 'symbol',
    minimumFractionDigits: decimalPlace,
    maximumFractionDigits: decimalPlace,
  })

  return value === '-0' ? '0' : value
}

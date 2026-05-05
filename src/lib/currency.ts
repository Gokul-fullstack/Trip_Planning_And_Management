import prisma from './prisma';

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  const rate = await prisma.exchangeRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency: from, toCurrency: to } }
  });
  if (!rate) return amount;
  return Math.round(amount * Number(rate.rate) * 100) / 100;
}

export async function getAllRates(baseCurrency: string = 'USD') {
  return prisma.exchangeRate.findMany({ where: { fromCurrency: baseCurrency } });
}

export const SUPPORTED_CURRENCIES = ['USD','EUR','GBP','INR','JPY','AUD','CAD','CHF','CNY','SGD'];

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

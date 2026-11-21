// Shared by the Stripe tracker and the public page. Money is always integer pence.
export const CONSERVATION_PERCENTAGE = 10;
export const CONSERVATION_PROGRAM = 'wildatlas-v1';

export function contributionPence(productPence: number): number {
  if (!Number.isSafeInteger(productPence) || productPence < 0) {
    throw new Error('Invalid product amount');
  }
  return Math.round(productPence / (100 / CONSERVATION_PERCENTAGE));
}

export function conservationQuarter(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = Math.floor(now.getUTCMonth() / 3) * 3;
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 3, 1));
  const format = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' });
  return {
    start: start.getTime() / 1000,
    end: end.getTime() / 1000,
    label: `${format.format(start)}–${format.format(new Date(Date.UTC(year, month + 2, 1)))} ${year}`,
  };
}

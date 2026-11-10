export type FundingSelection = Record<string, string>;
export function fundingCents(value: string | number): number {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return NaN;
  const cents = Math.round(Number(text) * 100);
  return Number.isSafeInteger(cents) ? cents : NaN;
}
export function fundingSources(selection: FundingSelection, total: string | number) {
  const sources = Object.entries(selection).map(([id, value]) => ({accountId: Number(id), cents: fundingCents(value)}));
  if (!sources.length || sources.length > 20) throw new Error("Choose between 1 and 20 funding sources.");
  if (sources.some(s => !Number.isSafeInteger(s.accountId) || s.accountId <= 0 || !Number.isFinite(s.cents) || s.cents <= 0))
    throw new Error("Enter a positive amount with at most two decimal places for each selected source.");
  if (sources.reduce((sum, s) => sum + s.cents, 0) !== fundingCents(total))
    throw new Error("Funding amounts must equal the total payment.");
  return sources.map(s => ({accountId: s.accountId, amount: s.cents / 100}));
}

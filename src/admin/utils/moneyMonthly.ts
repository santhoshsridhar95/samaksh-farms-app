export type MoneyAccount = { id: number; name: string; kind: string; balance: number };
export type MoneyEntry = { revision?: number; updatedAt?: string; updatedBy?: string; requestKey?: string; id: number; type: string; sourceId?: number; destinationId?: number; amount: number; description: string; payee?: string; salaryMonth?: string; date: string; recordedBy: string; reversalOf?: number };
const cents = (value: number) => Math.round(Number(value) * 100);
export function monthlyMoney(accounts: MoneyAccount[], entries: MoneyEntry[], month: string) {
  const selected = entries.filter(e => e.date?.slice(0, 7) === month);
  const byId = new Map(entries.map(e => [e.id, e]));
  function total(type: string) {
    return selected.reduce((sum, e) => sum + (e.type === type ? cents(e.amount) :
      e.type === "REVERSAL" && byId.get(e.reversalOf!)?.type === type ? -cents(e.amount) : 0), 0) / 100;
  }
  const rows = accounts.map(a => {
    let opening = 0, received = 0, paid = 0, current = 0;
    for (const e of entries) {
      const credit = e.destinationId === a.id ? cents(e.amount) : 0;
      const debit = e.sourceId === a.id ? cents(e.amount) : 0;
      current += credit - debit;
      if (e.date?.slice(0, 7) < month) opening += credit - debit;
      if (e.date?.slice(0, 7) === month) { received += credit; paid += debit; }
    }
    return { ...a, opening: opening / 100, received: received / 100, paid: paid / 100,
      closing: (opening + received - paid) / 100, current: current / 100 };
  });
  return { rows, entries: selected.filter(e => e.type !== "DIRECT_SALE_RECORD"),
    collections: total("COLLECTION") + total("LEGACY_COLLECTION"), expenses: total("EXPENSE"), salaries: total("SALARY"),
    closing: rows.filter(a => a.kind !== "PERSONAL").reduce((n, a) => n + cents(a.closing), 0) / 100 };
}

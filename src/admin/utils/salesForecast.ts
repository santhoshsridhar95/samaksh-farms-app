export type PlanningDay = { date: string; customerId: number | string; product: string; boxes: number; exchanges: number; returns: number };
export type PlanningHistory = { today: string; from: string; days: PlanningDay[] };
export function shiftDay(day: string, offset: number) {
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export function nextWeek(today: string) {
  const weekday = new Date(today + "T12:00:00Z").getUTCDay();
  const monday = shiftDay(today, weekday === 0 ? 1 : 8 - weekday);
  return Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
}
export function forecast(history: PlanningHistory, target: string, weeks: number, product: string, customerId?: string) {
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 8) throw new Error("Choose 1 to 8 weeks of history");
  const rows = history.days.filter(row => row.product === product && (!customerId || String(row.customerId) === customerId));
  const first = rows.reduce((min, row) => row.date < min ? row.date : min, history.today);
  const cutoff = target < history.today ? target : history.today;
  let candidate = shiftDay(target, -7);
  while (candidate >= cutoff) candidate = shiftDay(candidate, -7);
  const samples = [];
  for (let i = 0; i < weeks; i++, candidate = shiftDay(candidate, -7)) {
    if (candidate < history.from || candidate < first) break;
    const matching = rows.filter(row => row.date === candidate);
    samples.push({date: candidate, ...matching.reduce((sum, row) => ({ boxes: sum.boxes + row.boxes, exchanges: sum.exchanges + row.exchanges, returns: sum.returns + row.returns }), { boxes: 0, exchanges: 0, returns: 0 })});
  }
  const total = samples.reduce((sum, row) => ({ boxes: sum.boxes + row.boxes, exchanges: sum.exchanges + row.exchanges, returns: sum.returns + row.returns }), { boxes: 0, exchanges: 0, returns: 0 });
  const count = samples.length;
  const actual = rows.filter(row => row.date === target).reduce((sum, row) => sum + row.boxes, 0);
  return { count, samples, boxes: count ? total.boxes / count : null, exchanges: count ? total.exchanges / count : null,
    returns: count ? total.returns / count : null, rate: total.boxes ? 100 * total.exchanges / total.boxes : null,
    low: count ? Math.min(...samples.map(s => s.boxes)) : null,
    high: count ? Math.max(...samples.map(s => s.boxes)) : null, actual };
}

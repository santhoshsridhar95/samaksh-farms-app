import { useEffect, useState } from "react";
import api from "../services/api";
import { Panel } from "./AdminUI";
import { forecast, nextWeek, shiftDay } from "../utils/salesForecast";
import type { PlanningHistory } from "../utils/salesForecast";
import "./SalesForecast.css";

const number = (value: number | null) => value === null ? "—" : value.toLocaleString("en-IN", { maximumFractionDigits: 1 });
const weekdayLabel = (date: string) => new Date(date + "T12:00:00Z").toLocaleDateString("en-IN", {weekday:"long",timeZone:"UTC"});
const sampleTable = (samples: ReturnType<typeof forecast>["samples"]) => <div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>Date</th><th>Delivered boxes</th><th>Exchanges</th><th>Returns</th></tr></thead><tbody>{samples.map(s=><tr key={s.date}><td>{dateLabel(s.date)}</td><td>{number(s.boxes)}</td><td>{number(s.exchanges)}</td><td>{number(s.returns)}</td></tr>)}</tbody></table></div>;
const dateLabel = (date: string) => new Date(date + "T12:00:00Z").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export default function SalesForecast({ revision, customerId, product, date }: {
  revision: unknown; customerId?: string; product?: string; date?: string;
}) {
  const [history, setHistory] = useState<PlanningHistory | null>(null);
  const [weeks, setWeeks] = useState(8);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true); setError("");
    api.get("/api/sales/planning-history", refresh ? { headers: { "Cache-Control": "no-cache" } } : {}).then(response => {
      if (current) setHistory(response.data.data);
    }).catch(() => { if (current) setError("Could not load planning history. Retry to see suggestions."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [revision, refresh]);
  useEffect(() => {
    const update = () => setRefresh(value => value + 1);
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, []);
  const products = [...new Set(history?.days.map(row => row.product) || [])].sort();
  const chosen = customerId !== undefined ? product || "" : selectedProduct || products.find(name => /oyster/i.test(name)) || products[0] || "";
  const controls = <div className="forecast-controls">
    <label>History <select value={weeks} onChange={e => setWeeks(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} {n === 1 ? "week" : "weeks"}</option>)}</select></label>
    <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setRefresh(n => n + 1)} disabled={loading}>Refresh</button>
  </div>;
  if (loading || error || !history) return <div className={customerId !== undefined ? "forecast-inline" : "forecast-hint"} role="status">{loading ? "Loading weekday suggestions…" : error}{!loading && (customerId !== undefined ? <button type="button" className="forecast-retry" onClick={() => setRefresh(n => n + 1)}>Retry</button> : controls)}</div>;
  if (customerId !== undefined) {
    if (!customerId) return null;
    const target = date || history.today;
    const estimate = forecast(history, target, weeks, chosen, customerId);
    return <div className="forecast-inline forecast-inline-highlight" title={`Tentative delivery average over up to ${weeks} previous matching weekdays. Missing days after the first sale count as zero. Exchanges are bill credits, not additional delivery boxes.`}>
      <div className="forecast-inline-header">
        <div><strong>Weekday guide · {dateLabel(target)}</strong>{estimate.count > 0 && <span className="forecast-inline-history"> · {estimate.count}-week average{estimate.count < 4 ? " · Limited history" : ""}</span>}</div>
        <label className="forecast-inline-selector">History <select value={weeks} onChange={e => setWeeks(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} {n === 1 ? "week" : "weeks"}</option>)}</select></label>
      </div>
      <div className="forecast-inline-metrics">
        <div className="forecast-mini-card"><span>Tentative boxes</span><b>{number(estimate.boxes)}</b></div>
        <div className="forecast-mini-card"><span>Tentative exchange boxes</span><b>{number(estimate.exchanges)}</b></div>
        {estimate.count ? <span className="forecast-inline-secondary">Returns: {number(estimate.returns)} · Exchange rate: {number(estimate.rate)}{estimate.rate !== null ? "%" : ""}</span> : <span className="forecast-inline-secondary">No matching weekday history for this shop and product yet.</span>}
      </div>
      <p>Based only on previous {weekdayLabel(target)}s · {estimate.count} of {weeks} completed matching days available.</p>
      {!!estimate.count&&<details><summary>View {weekdayLabel(target)} history and trend</summary>{sampleTable(estimate.samples)}<small>Tentative boxes = sum of these daily box totals ÷ {estimate.count}. Missing dates after the first recorded sale count as zero. This is a delivery average, not a probability of a sale.</small></details>}
    </div>;
  }
  const week = nextWeek(history.today);
  const dates = [shiftDay(history.today, -1), history.today, shiftDay(history.today, 1)];
  const total = week.map(day => forecast(history, day, weeks, chosen));
  const table = (days: string[]) => <div className="admin-table-wrapper"><table className="admin-table forecast-table">
    <thead><tr><th>Day</th><th>Expected boxes</th><th>Past range</th><th>Expected exchanges</th><th>Expected returns</th><th>Exchange rate</th><th>Matching weekday history</th><th>Actual boxes</th></tr></thead>
    <tbody>{days.map(day => { const result = forecast(history, day, weeks, chosen); return <tr key={day}>
      <td>{dateLabel(day)}{day === history.today ? " · Today" : day === dates[0] ? " · Yesterday" : day === dates[2] ? " · Tomorrow" : ""}</td>
      <td><strong>{number(result.boxes)}</strong></td><td>{result.count ? `${number(result.low)}–${number(result.high)}` : "—"}</td>
      <td>{number(result.exchanges)}</td><td>{number(result.returns)}</td><td>{number(result.rate)}{result.rate !== null ? "%" : ""}</td>
      <td>{result.count} / {weeks}{result.count < 4 ? " · Limited" : ""}{result.count>0&&<details><summary>View {weekdayLabel(day)}s</summary>{sampleTable(result.samples)}</details>}</td><td>{day <= history.today ? `${number(result.actual)}${day === history.today ? " so far" : ""}` : "—"}</td>
    </tr>; })}</tbody>
  </table></div>;
  return <Panel title="Sales planning" subtitle="Tentative shop deliveries by weekday, based on completed days. Direct sales are excluded." actions={controls}>
    <div className="forecast-controls"><label>Product <select value={chosen} onChange={e => setSelectedProduct(e.target.value)}>{products.map(name => <option key={name}>{name}</option>)}</select></label></div>
    {!products.length ? <p>No delivery history yet. Suggestions will appear after sales are recorded.</p> : <>
      <h3>Yesterday, today and tomorrow</h3>{table(dates)}
      <h3>Next week · Monday to Sunday</h3>{table(week)}
      <p><strong>Next week expected deliveries: {total.every(day => day.count > 0) ? `${number(total.reduce((sum, day) => sum + (day.boxes || 0), 0))} boxes` : "Not enough history for all seven days"}</strong></p>
      <p>Purchase planning: compare expected deliveries with usable stock and confirmed harvest. Deduct those supplies before outsourcing; exchanges shown here are bill-credit records, not extra boxes to add.</p>
      <details><summary>How these suggestions work</summary><p>Each day uses only its own weekday: Tuesdays use previous Tuesdays, Thursdays use previous Thursdays, and so on. Each estimate is the average daily total for the previous {weeks} completed matching weekdays before today (or before the selected historical date). All entries on a day are combined. Days without entries after the first recorded sale count as zero; incomplete records and stockouts can understate demand. Current-day sales never enter the average. Past range is the observed minimum–maximum, not a guaranteed forecast range. Fewer than four matching days means limited history.</p><p>Exchange rate = total recorded exchange boxes ÷ total delivered boxes over the same sample. Returns and exchanges are shown separately and must not be added together as waste. Delivery quantities measure boxes supplied to shops, not their consumer sell-through. Refresh after entries made elsewhere; this page also refreshes when you return to the window.</p></details>
    </>}
  </Panel>;
}

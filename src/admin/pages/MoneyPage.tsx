import { fundingAccountLabel } from "../utils/fundingAccounts";
import HistoricalDataLink from "../components/HistoricalDataLink";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { salarySummary, type EmployeeDirectory } from "../utils/employees";
import { Link, useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { EmptyState, Field, PageHeader, Panel } from "../components/AdminUI";
import api, { invalidateReadCache } from "../services/api";
import { getStoredRoles } from "../../routes/authSession";
import { monthlyMoney, type MoneyAccount as Account, type MoneyEntry as Entry } from "../utils/moneyMonthly";
import "./MoneyPage.css";

type Ledger = { accounts: Account[]; entries: Entry[]; reconciliationRequired: boolean };
const labels: Record<string, string> = { EXPENSE: "Expense", SALARY: "Salary payment", TRANSFER: "Transfer", REIMBURSEMENT: "Personal reimbursement", OPENING: "Opening balance", CONTRIBUTION: "Personal contribution" };
const kindLabels: Record<string, string> = { HELD: "Farm money held", PERSONAL: "Personal pocket", BANK: "Bank account", SAVINGS: "Savings", HISTORICAL: "Historical recipient" };
export const rupees = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
export const todayIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export function errorMessage(error: unknown) { return (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not complete the request. Please retry."; }
const newForm = (type = "EXPENSE") => ({ type, sourceId: "", destinationId: "", amount: "", description: "", payee: "", employeeId: "", salaryMonth: todayIndia().slice(0, 7), date: todayIndia() });
export function MoneySpinner() { return <span className="money-spinner" aria-hidden="true" />; }
export function MoneyDialog({ title, busy, close, children }: { title: string; busy: boolean; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="money-dialog" aria-label={title} onCancel={e => { e.preventDefault(); if (!busy) close(); }}>
    <div className="money-dialog-heading"><h2>{title}</h2><button type="button" className="admin-button admin-button-secondary" disabled={busy} onClick={close}>Close</button></div>{children}
  </dialog>;
}

export default function MoneyPage() {
  const [ledger, setLedger] = useState<Ledger>({ accounts: [], entries: [], reconciliationRequired: false });
  const [loading, setLoading] = useState(true);
  const [directory, setDirectory] = useState<EmployeeDirectory>({ employees: [], salaries: [] });
  const [params] = useSearchParams();
  const [employeeFilter, setEmployeeFilter] = useState(params.get("employeeId") || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState(params.get("employeeId") ? "salary" : "overview");
  const [filter, setFilter] = useState("");
  const [month, setMonth] = useState(todayIndia().slice(0, 7));
  const [form, setForm] = useState(newForm);
  const [account, setAccount] = useState({ name: "", kind: "PERSONAL" });
  const [dialog, setDialog] = useState<"entry" | "account" | "reconcile" | "move" | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [reconciliation, setReconciliation] = useState({accountId:"",actualBalance:"",expectedBalance:0,reason:"Opening cash verification after historical imports"});
  const [movement, setMovement] = useState({sourceId:"",destinationId:"",amount:"",full:false,date:todayIndia(),description:""});
  const requestKey = useRef(crypto.randomUUID());
  const submitting = useRef(false);
  const currentMonth = todayIndia().slice(0, 7);
  const monthly = monthlyMoney(ledger.accounts, ledger.entries, month);
  const farmRows = monthly.rows.filter(a => a.kind !== "PERSONAL");
  const accountName = (id?: number) => ledger.accounts.find(a => a.id === id)?.name || "Outside farm accounts";
  const selectedEmployee = directory.employees.find(e=>String(e.id)===form.employeeId);
  const selectedSalary = selectedEmployee ? salarySummary(selectedEmployee,directory.salaries,ledger.entries,form.salaryMonth) : null;
  const salaryDefault = (id: number, salaryMonth: string) => {const employee=directory.employees.find(e=>e.id===id);return employee?salarySummary(employee,directory.salaries,ledger.entries,salaryMonth).remaining:0;};
  const movementSource = monthly.rows.find(a=>String(a.id)===movement.sourceId);
  const reconAccount = monthly.rows.find(a=>String(a.id)===reconciliation.accountId);
  function openReconciliation(id?:number) { const a=monthly.rows.find(a=>a.id===id);setReconciliation({accountId:a?String(a.id):"",actualBalance:a?String(a.current):"",expectedBalance:a?.current||0,reason:"Opening cash verification after historical imports"});requestKey.current=crypto.randomUUID();setError("");setDialog("reconcile"); }
  function openMovement(id?:number,full=false,destinationId?:number) {setMovement({sourceId:id?String(id):"",destinationId:destinationId?String(destinationId):"",amount:"",full,date:todayIndia(),description:""});requestKey.current=crypto.randomUUID();setError("");setDialog("move");}
  const incoming = ["OPENING", "CONTRIBUTION"].includes(form.type);
  const source = monthly.rows.find(a => String(a.id) === form.sourceId);
  const reversed = new Set(ledger.entries.filter(e => e.reversalOf).map(e => e.reversalOf));
  const history = monthly.entries.filter(e => (!employeeFilter || e.employeeId === Number(employeeFilter)) && (!filter || e.sourceId === Number(filter) || e.destinationId === Number(filter)) &&
    (tab !== "salary" || e.type === "SALARY" || (e.type === "REVERSAL" && !!e.salaryMonth)));
  const canAudit = getStoredRoles().some(r => ["SUPER_ADMIN", "FARM_MANAGER"].includes(r));
  async function fetchLedger() { const [r,d] = await Promise.all([api.get("/api/money", { timeout: 30000 }),api.get("/api/employees")]); setLedger(r.data.data); setDirectory(d.data.data); }
  async function refresh(force=false) { if(force)invalidateReadCache();
    setLoading(true); setError("");
    try { await fetchLedger(); } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  function openEntry(type: string) { setEditing(null); setForm({ ...newForm(type), employeeId: employeeFilter, payee: directory.employees.find(e=>String(e.id)===employeeFilter)?.name || "", amount: type==="SALARY" && employeeFilter ? String(salaryDefault(Number(employeeFilter),currentMonth)) : "" }); requestKey.current = crypto.randomUUID(); setError(""); setDialog("entry"); }
  function editEntry(entry: Entry) {
    setEditing(entry); setForm({ employeeId: String(entry.employeeId || ""), type: entry.type, sourceId: String(entry.sourceId || ""), destinationId: String(entry.destinationId || ""), amount: String(entry.amount), date: entry.date, description: entry.description, payee: entry.payee || "", salaryMonth: entry.salaryMonth || currentMonth });
    requestKey.current = crypto.randomUUID(); setError(""); setDialog("entry");
  }
  function closeDialog() { if (!submitting.current) { setDialog(null); setError(""); } }
  async function save(event: FormEvent) {
    event.preventDefault(); if (submitting.current) return;
    submitting.current = true; setBusy(true); setError(""); setMessage("");
    try {
      let savedEntry: Entry | undefined;
      if (dialog === "entry") {
        const payload = { ...form, requestKey: requestKey.current, amount: Number(form.amount), sourceId: form.type === "OPENING" ? null : form.sourceId ? Number(form.sourceId) : null, destinationId: incoming || ["TRANSFER", "REIMBURSEMENT"].includes(form.type) ? Number(form.destinationId) : null, employeeId: ["SALARY","EXPENSE"].includes(form.type) && form.employeeId ? Number(form.employeeId) : null, payee: ["SALARY","EXPENSE"].includes(form.type) ? form.payee : null, salaryMonth: form.type === "SALARY" ? form.salaryMonth : null };
        const r = editing ? await api.put(`/api/money/entries/${editing.id}`, { entry: payload, expectedRevision: editing.revision || 0 }, { timeout: 30000 }) : await api.post("/api/money/entries", payload, { timeout: 30000 });
        savedEntry = r.data.data; setMonth(form.date.slice(0, 7)); setMessage("Transaction saved. Balances and audit history updated.");
      } else if (dialog === "reconcile") {
        const r = await api.post("/api/money/reconcile",{...reconciliation,accountId:Number(reconciliation.accountId),actualBalance:Number(reconciliation.actualBalance),requestKey:requestKey.current},{timeout:30000});
        savedEntry=r.data.data;setMonth(currentMonth);setMessage("Actual balance saved. Historical entries remain intact; new transactions update this corrected balance.");
      } else if (dialog === "move") {
        const r = movement.full ? await api.post("/api/money/settle",{sourceId:Number(movement.sourceId),destinationId:Number(movement.destinationId),requestKey:requestKey.current},{timeout:30000}) : await api.post("/api/money/entries",{type:movementSource?.kind==="PERSONAL"?"CONTRIBUTION":"TRANSFER",sourceId:Number(movement.sourceId),destinationId:Number(movement.destinationId),amount:Number(movement.amount),date:movement.date,description:movement.description,requestKey:requestKey.current},{timeout:30000});
        savedEntry=r.data.data;setMonth(savedEntry!.date.slice(0,7));setMessage("Money movement recorded. Account balances updated.");
      } else if (dialog === "account") {
        const r = await api.post("/api/money/accounts", account, { timeout: 30000 });
        setLedger(l => ({ ...l, accounts: [...l.accounts.filter(a => a.id !== r.data.data.id), { ...r.data.data, balance: 0 }] }));
        setAccount({ name: "", kind: "PERSONAL" }); setMessage("Account saved and added to the audit trail.");

      }
      if (savedEntry) { const entry = savedEntry; setLedger(l => ({ ...l, entries: [entry, ...l.entries.filter(e => e.id !== entry.id)] })); }
      setDialog(null); requestKey.current = crypto.randomUUID();
      try { await fetchLedger(); } catch (e) { setError("Saved successfully, but refreshing failed. Use Refresh. " + errorMessage(e)); }
    } catch (e) { setError(errorMessage(e)); } finally { submitting.current = false; setBusy(false); }
  }
  return <AdminLayout><HistoricalDataLink module="MONEY"/>
    <PageHeader title="Money & Expenses" subtitle="Monthly spending, actual money held and transfers between people or accounts." actions={<button type="button" className="admin-button admin-button-secondary" onClick={()=>refresh(true)} disabled={loading || busy} aria-busy={loading}>{loading && <MoneySpinner />}{loading ? "Refreshing…" : "Refresh"}</button>} />
    <div className="money-toolbar"><Field label="Month"><input type="month" required max={currentMonth} value={month} onChange={e => { if (e.target.value && e.target.value <= currentMonth) setMonth(e.target.value); }} /></Field><div className="money-actions"><button className="admin-button" disabled={busy || loading} onClick={() => openEntry("EXPENSE")}>Add expense</button><button className="admin-button admin-button-secondary" disabled={busy || loading} onClick={() => openEntry("SALARY")}>Pay salary</button><button className="admin-button admin-button-secondary" disabled={busy || loading} onClick={() => openMovement()}>Transfer / add funds</button></div></div>
    {error && !dialog && <p role="alert" className="money-error">{error}</p>}{message && <p role="status" className="money-success">{message}</p>}{busy && !dialog && <p role="status"><MoneySpinner /> Updating balances…</p>}
    {ledger.reconciliationRequired && <details className="money-reconciliation"><summary>Historical balances need verification against Excel</summary><p>Older receipts use the collector stored on each sale. Historical handover recipients are separate accounts. Use Set actual balances to enter what each holder has now, including zero. Corrections preserve old transactions without counting missing historical spending as a new expense. Finish historical imports first; later imports or edits can change balances again.</p></details>}
    <div className="admin-tabbar" role="tablist" aria-label="Money sections">{[["overview", "Monthly overview"], ["reimbursements", "Personal reimbursements"], ["history", "Transactions"], ["salary", "Salary register"], ["accounts", "Accounts & setup"]].map(([id, label]) => <button type="button" role="tab" aria-selected={tab === id} className={`admin-tab ${tab === id ? "is-active" : ""}`} key={id} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === "overview" && <>
      <Panel title={`Monthly summary · ${month}`} subtitle="Transfers move existing money; they are not expenditure."><div className="admin-table-wrapper"><table className="admin-table money-table money-summary"><thead><tr><th>Sales collected</th><th>Expenses</th><th>Salaries</th><th>Total expenditure</th><th>Farm funds at month end</th></tr></thead><tbody><tr><td>{rupees(monthly.collections)}</td><td>{rupees(monthly.expenses)}</td><td>{rupees(monthly.salaries)}</td><td>{rupees(monthly.expenses + monthly.salaries)}</td><td>{rupees(monthly.closing)}</td></tr></tbody></table></div></Panel>
      <Panel title="Who holds the money?" subtitle="Opening + received − paid / transferred + balance corrections = closing. Set actual balances today to reconcile missing historical spending." actions={<><button className="admin-button admin-button-secondary" disabled={loading||busy} onClick={()=>openReconciliation()}>Set actual balances</button><button className="admin-button admin-button-secondary" disabled={loading||busy} onClick={()=>openMovement()}>Add funds to holder</button></>}><div className="admin-table-wrapper"><table className="admin-table money-table"><thead><tr><th>Person / account</th><th>Opening</th><th>Received this month</th><th>Paid / transferred</th><th>Balance corrections</th><th>Closing balance</th><th>Status / action</th></tr></thead><tbody>{farmRows.map(a => <tr key={a.id}><td><strong>{a.name}</strong><small>{kindLabels[a.kind]}</small></td><td>{rupees(a.opening)}</td><td>{rupees(a.received)}</td><td>{rupees(a.paid)}</td><td>{rupees(a.adjustments)}</td><td className={a.closing < 0 ? "money-negative" : "money-balance"}>{rupees(a.closing)}</td><td><div className="money-account-action"><span>{month!==currentMonth?"Historical month":a.closing===0?"Clear":a.closing<0?"Needs reconciliation":"Available"}</span><select aria-label={"Action for " + a.name} value="" disabled={busy||loading} onChange={e=>{if(e.target.value==="transfer")openMovement(a.id);if(e.target.value==="all")openMovement(a.id,true);}}><option value="">Choose action…</option><option value="transfer" disabled={a.current<=0}>Transfer an amount</option><option value="all" disabled={a.current<=0}>Transfer full balance</option></select></div></td></tr>)}</tbody></table></div>{!farmRows.length && <EmptyState title={loading ? "Loading accounts…" : "No farm accounts yet"} />}</Panel>
    </>}
    {tab === "reimbursements" && <>
      <Panel title="Personal payments and repayments" subtitle="Record actual repayments from a farm account. Reimbursements reduce the amount owed without counting the expense twice." actions={<button className="admin-button" disabled={busy||loading} onClick={()=>openEntry("REIMBURSEMENT")}>Record reimbursement</button>}>
        <div className="admin-table-wrapper"><table className="money-table"><thead><tr><th>Personal account</th><th>Paid this month</th><th>Returned / reversed this month</th><th>Owed at month end</th><th>Owed now</th><th>Action</th></tr></thead><tbody>{monthly.rows.filter(a=>a.kind==="PERSONAL").map(a=><tr key={a.id}><td>{a.name}</td><td>{rupees(a.paid)}</td><td>{rupees(a.received)}</td><td>{rupees(Math.max(0,-a.closing))}</td><td>{rupees(Math.max(0,-a.current))}{a.current>0&&<small>Farm to recover {rupees(a.current)}</small>}</td><td><button className="admin-button admin-button-secondary" disabled={busy||loading||a.current>=0} onClick={()=>{openEntry("REIMBURSEMENT");setForm({...newForm("REIMBURSEMENT"),destinationId:String(a.id),amount:String(-a.current),description:"Repayment of personal farm spending"});}}>Repay</button></td></tr>)}</tbody></table></div>
      </Panel>
      <Panel title={"Reimbursement history · "+month}><div className="admin-table-wrapper"><table className="money-table"><thead><tr><th>Date</th><th>Farm account</th><th>Repaid to</th><th>Amount</th><th>Details</th><th>Action</th></tr></thead><tbody>{monthly.entries.filter(e=>e.type==="REIMBURSEMENT").map(e=><tr key={e.id}><td>{e.date}</td><td>{accountName(e.sourceId)}</td><td>{accountName(e.destinationId)}</td><td>{rupees(Number(e.amount))}</td><td>{e.description}</td><td>{getStoredRoles().includes("SUPER_ADMIN")&&!reversed.has(e.id)&&<button className="admin-button admin-button-secondary" disabled={busy} onClick={()=>editEntry(e)}>Edit</button>}</td></tr>)}</tbody></table></div></Panel>
    </>}
    {tab === "salary" && <Panel title={"Salary due · " + month} subtitle="Salary month totals include payments on other dates. Enter the actual amount paid; partial payments are supported."><div className="admin-table-wrapper"><table className="admin-table money-table"><thead><tr><th>Employee</th><th>Monthly salary</th><th>Paid</th><th>Remaining</th><th>Overpaid</th></tr></thead><tbody>{directory.employees.filter(e=>!employeeFilter||String(e.id)===employeeFilter).map(e=>{const s=salarySummary(e,directory.salaries,ledger.entries,month);return <tr key={e.id}><td><Link to="/admin/employees">{e.name}</Link></td><td>{rupees(s.salary)}</td><td>{rupees(s.paid)}</td><td>{rupees(s.remaining)}</td><td>{rupees(s.overpaid)}</td></tr>;})}</tbody></table></div></Panel>}
    {(tab === "history" || tab === "salary") && <Panel title={tab === "salary" ? `Salary payments · ${month}` : `Transactions · ${month}`} subtitle="Payments made during the selected month. Admin edits update balances and retain before-and-after values in the audit trail.">
      <div className="money-toolbar"><Field label="Filter employee"><select value={employeeFilter} onChange={e=>setEmployeeFilter(e.target.value)}><option value="">All employees</option>{directory.employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></Field><Field label="Filter account"><select value={filter} onChange={e => setFilter(e.target.value)}><option value="">All accounts</option>{ledger.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>{canAudit && <Link className="admin-button admin-button-secondary" to="/admin/audit">View audit trail</Link>}</div>
      <div className="admin-table-wrapper"><table className="admin-table money-table money-history"><thead><tr><th>Date / type</th><th>Paid from</th><th>Received by</th><th>Amount</th><th>Purpose</th><th>Recorded by</th><th>Edit</th></tr></thead><tbody>{history.map(e => <tr key={e.id}><td>{e.date}<small>{(e.type === "BALANCE_ADJUSTMENT" ? "Actual balance correction" : labels[e.type]) || e.type.replace(/_/g, " ")}</small></td><td>{accountName(e.sourceId)}</td><td>{e.payee || accountName(e.destinationId)}{e.salaryMonth && <small>Salary: {e.salaryMonth}</small>}</td><td>{rupees(Number(e.amount))}</td><td>{e.description}{reversed.has(e.id) && <small>Reversed — see correction entry</small>}{e.reversalOf && <small>Reverses #{e.reversalOf}</small>}</td><td>{e.recordedBy}</td><td>{getStoredRoles().includes("SUPER_ADMIN") && labels[e.type] && !e.requestKey?.startsWith("source:") && !reversed.has(e.id) && <button className="admin-button admin-button-secondary" disabled={busy} onClick={() => editEntry(e)}>Edit</button>}</td></tr>)}</tbody></table></div>{!history.length && <EmptyState title="No transactions for this month" />}
    </Panel>}
    {tab === "accounts" && <Panel title="Accounts & setup" subtitle="Keep personal pockets separate from farm money held." actions={<button className="admin-button" disabled={busy || loading} onClick={() => { setError(""); setDialog("account"); }}>Add account</button>}><div className="admin-table-wrapper"><table className="admin-table money-table"><thead><tr><th>Account</th><th>Type</th><th>Current balance / personal amount owed</th></tr></thead><tbody>{monthly.rows.map(a => <tr key={a.id}><td>{a.name}</td><td>{kindLabels[a.kind]}</td><td>{rupees(a.kind === "PERSONAL" ? -a.current : a.current)}</td></tr>)}</tbody></table></div><div className="money-actions"><button className="admin-button admin-button-secondary" disabled={busy || loading} onClick={() => openEntry("OPENING")}>Add opening balance</button><button className="admin-button admin-button-secondary" disabled={busy || loading} onClick={() => openEntry("CONTRIBUTION")}>Record personal contribution</button></div></Panel>}
    {dialog && <MoneyDialog title={dialog === "reconcile" ? "Set actual money held" : dialog === "move" ? "Transfer money / add personal funds" : dialog === "entry" ? (editing ? "Edit transaction" : labels[form.type]) : dialog === "account" ? "Add account" : "Correct a transaction"} busy={busy} close={closeDialog}><form onSubmit={save} aria-busy={busy}><fieldset disabled={busy} className="money-form money-fieldset">
      {dialog === "entry" && <>
        {editing && <Field label="Transaction type"><select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, sourceId: "", destinationId: "" }))}>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>}
        {(!incoming || form.type === "CONTRIBUTION") && <Field label={form.type === "CONTRIBUTION" ? "Personal pocket providing funds" : "Paid from"} required><select required value={form.sourceId} onChange={e => setForm(f => ({ ...f, sourceId: e.target.value }))}><option value="">Select funding source</option>{monthly.rows.filter(a => form.type === "CONTRIBUTION" ? a.kind === "PERSONAL" : !["TRANSFER","REIMBURSEMENT"].includes(form.type) || a.kind !== "PERSONAL").map(a => <option key={a.id} value={a.id}>{fundingAccountLabel({...a,balance:a.current})}</option>)}</select></Field>}
        {(incoming || ["TRANSFER", "REIMBURSEMENT"].includes(form.type)) && <Field label={form.type === "REIMBURSEMENT" ? "Repaid to" : "Received into"} required><select required value={form.destinationId} onChange={e => setForm(f => ({ ...f, destinationId: e.target.value }))}><option value="">Select recipient account</option>{monthly.rows.filter(a => (form.type === "REIMBURSEMENT" ? a.kind === "PERSONAL" : a.kind !== "PERSONAL") && String(a.id) !== form.sourceId).map(a => <option key={a.id} value={a.id}>{fundingAccountLabel({...a,balance:a.current})}</option>)}</select></Field>}
        <Field label="Amount (₹)" required><input required type="number" min="0.01" max="999999999999.99" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></Field>
        <Field label="Payment date" required><input required type="date" max={todayIndia()} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
        {["SALARY","EXPENSE"].includes(form.type) && <Field label={form.type==="SALARY"?"Employee":"Employee expense (optional)"} required={form.type==="SALARY"}><select required={form.type==="SALARY" && !editing?.payee} value={form.employeeId} onChange={e=>{const employee=directory.employees.find(p=>String(p.id)===e.target.value);setForm(f=>({...f,employeeId:e.target.value,payee:employee?.name || "",amount:f.type==="SALARY" && employee?String(salaryDefault(employee.id,f.salaryMonth)):f.amount}));}}><option value="">{editing?.payee && !editing.employeeId ? "Legacy: " + editing.payee : "Select employee"}</option>{directory.employees.map(e=><option key={e.id} value={e.id}>{e.name} · {e.designation}{!e.active?" (inactive)":""}</option>)}</select><Link to="/admin/employees">Manage employees and salaries</Link></Field>}
        {form.type === "SALARY" && <><Field label="Salary for month" required><input required type="month" value={form.salaryMonth} onChange={e => setForm(f => ({ ...f, salaryMonth: e.target.value, amount: f.employeeId ? String(salaryDefault(Number(f.employeeId),e.target.value)) : f.amount }))} /></Field></>}
        {form.type==="SALARY"&&selectedSalary&&<p className="money-wide">Monthly salary {rupees(selectedSalary.salary)} · already paid {rupees(selectedSalary.paid)} · remaining {rupees(selectedSalary.remaining)}. {editing?"Totals include the payment being edited.":"The amount starts at the remaining salary; adjust it for a partial payment."}</p>}
        <Field label={form.type === "CONTRIBUTION" ? "Contributor and purpose" : "Purpose / details"} span="full" required><textarea required maxLength={1000} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
        {source && <p className="money-wide">{source.kind === "PERSONAL" ? form.type === "CONTRIBUTION" ? "Adds farm funds and records the amount owed to this personal pocket." : "Personal spending: farm-held money stays unchanged." : `Deduct ${rupees(Number(form.amount || 0))} from ${source.name}’s farm funds.`}</p>}
        {form.type === "REIMBURSEMENT" && <p className="money-wide">Repay only money actually returned to this person. Partial repayments are supported; the remaining amount stays owed. Edit repayments here or in Transactions.</p>}
        {form.type === "OPENING" && <p className="money-wide">Only enter verified money missing from the app. Do not count imported collections again.</p>}
      </>}
      {dialog === "reconcile" && <>
        <p className="money-wide">Enter the total this holder actually has today, not an amount to add or subtract. Use 0 to clear an old balance. This corrects cash only; it does not change historical sales, expenses or profit.</p>
        <Field label="Holder / farm account" required span="full"><select required value={reconciliation.accountId} onChange={e=>{const a=monthly.rows.find(a=>String(a.id)===e.target.value);setReconciliation(r=>({...r,accountId:e.target.value,actualBalance:a?String(a.current):"",expectedBalance:a?.current||0}));}}><option value="">Choose holder or account</option>{farmRows.map(a=><option key={a.id} value={a.id}>{fundingAccountLabel({...a,balance:a.current})}</option>)}</select></Field>
        <Field label="Actual amount held now (₹)" required><input required type="number" min="0" max="999999999999.99" step="0.01" value={reconciliation.actualBalance} onChange={e=>setReconciliation(r=>({...r,actualBalance:e.target.value}))}/></Field>
        <button type="button" className="admin-button admin-button-secondary" onClick={()=>setReconciliation(r=>({...r,actualBalance:"0"}))}>Set to zero</button>
        {reconAccount&&<p className="money-wide">Recorded balance: <strong>{rupees(reconciliation.expectedBalance)}</strong> → actual balance: <strong>{rupees(Number(reconciliation.actualBalance||0))}</strong>. Correction: {rupees(Number(reconciliation.actualBalance||0)-reconciliation.expectedBalance)}. Effective today, {todayIndia()}.</p>}
        <Field label="Reason for correction" required span="full"><textarea required maxLength={900} value={reconciliation.reason} onChange={e=>setReconciliation(r=>({...r,reason:e.target.value}))}/></Field>
      </>}
      {dialog === "move" && <>
        <Field label="From holder / personal pocket" required span="full"><select required value={movement.sourceId} onChange={e=>{const a=monthly.rows.find(a=>String(a.id)===e.target.value);setMovement(m=>({...m,sourceId:e.target.value,full:a?.kind==="PERSONAL"?false:m.full,destinationId:e.target.value===m.destinationId?"":m.destinationId}));}}><option value="">Choose who provides the money</option>{monthly.rows.map(a=><option key={a.id} value={a.id}>{fundingAccountLabel({...a,balance:a.current})}</option>)}</select></Field>
        <Field label="To holder / farm account" required span="full"><select required value={movement.destinationId} onChange={e=>setMovement(m=>({...m,destinationId:e.target.value}))}><option value="">Choose who receives the money</option>{farmRows.filter(a=>String(a.id)!==movement.sourceId).map(a=><option key={a.id} value={a.id}>{fundingAccountLabel({...a,balance:a.current})}</option>)}</select></Field>
        {movementSource?.kind!=="PERSONAL"&&<Field label="Amount to transfer"><select value={movement.full?"all":"partial"} onChange={e=>setMovement(m=>({...m,full:e.target.value==="all"}))}><option value="partial">Enter an amount</option><option value="all">Full available balance</option></select></Field>}
        {!movement.full&&<><Field label="Amount (₹)" required><input required type="number" min="0.01" max="999999999999.99" step="0.01" value={movement.amount} onChange={e=>setMovement(m=>({...m,amount:e.target.value}))}/></Field><Field label="Transfer date" required><input required type="date" max={todayIndia()} value={movement.date} onChange={e=>setMovement(m=>({...m,date:e.target.value}))}/></Field><Field label="Purpose / details" required span="full"><textarea required maxLength={1000} value={movement.description} onChange={e=>setMovement(m=>({...m,description:e.target.value}))}/></Field></>}
        <p className="money-wide">{movementSource?.kind==="PERSONAL"?"Personal funds added to the farm: the recipient’s farm balance increases and the contribution is tracked as owed to this personal pocket. Use Personal reimbursements when repaying it.":movement.full?"Transfers the full available balance at save time, dated today. Current amount: " + rupees(movementSource?.current||0) + ".":"Moves existing farm funds between holders or accounts. No Samaksh bank account is required."} Record only money actually handed over.</p>
      </>}
      {dialog === "account" && <><Field label="Account name" required><input required maxLength={150} placeholder="Santosh personal pocket" value={account.name} onChange={e => setAccount(a => ({ ...a, name: e.target.value }))} /></Field><Field label="Account type"><select value={account.kind} onChange={e => setAccount(a => ({ ...a, kind: e.target.value }))}>{Object.entries(kindLabels).filter(([key]) => key !== "HISTORICAL").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field></>}
      <div className="money-dialog-actions money-wide"><button type="button" className="admin-button admin-button-secondary" onClick={closeDialog}>Cancel</button><button type="submit" className="admin-button" disabled={busy} aria-busy={busy}>{busy && <MoneySpinner />}{busy ? "Saving…" : dialog === "move" && movement.full ? "Confirm full transfer" : dialog === "reconcile" ? "Save actual balance" : editing && dialog === "entry" ? "Save changes" : "Save"}</button></div>
    </fieldset>{busy && <p role="status"><MoneySpinner /> Saving to the database and updating the audit trail…</p>}{error && <p role="alert" className="money-error">{error}</p>}</form></MoneyDialog>}
  </AdminLayout>;
}

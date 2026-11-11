import { useEffect, useRef, useState, type FormEvent } from "react";
import { getStoredRoles } from "../../routes/authSession";
import { exactContactMatch, findCustomers, type DirectCustomer as Customer } from "../utils/directSaleCustomers";
import "./DirectSalesPage.css";
import { EmptyState, Field, PageHeader, Panel, StatCard } from "../components/AdminUI";
import api, { invalidateReadCache } from "../services/api";
import { errorMessage, rupees, todayIndia, MoneyDialog } from "./MoneyPage";
import "./MoneyPage.css";

type Sale = { unitPrice?:number; collectorUserId?:number; remarks?:string; fingerprint?:string; id: number; customerId: number; customerName: string; productName: string; quantity: number; totalAmount: number; amountCollected: number; pendingAmount: number; purchaseLocation: string; saleDate: string; collectorName?: string };
const emptyForm = { saleDate: "", collectorUserId: "", customerId: "", customerName: "", phoneNumber: "", email: "", address: "", purchaseLocation: "", productName: "", quantity: "1", unitPrice: "", amountCollected: "", remarks: "" };

export default function DirectSalesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [form, setForm] = useState({...emptyForm,saleDate:todayIndia()});
  const [editing,setEditing]=useState<Sale|null>(null);
  const [customerEdit,setCustomerEdit]=useState<Customer|null>(null);
  const formRef=useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [historyCustomer, setHistoryCustomer] = useState("");
  const [payment, setPayment] = useState<{ sale: Sale; amount: string } | null>(null);
  const requestKey = useRef(crypto.randomUUID());
  const submitting = useRef(false);
  const [isAdmin] = useState(() => getStoredRoles().includes("SUPER_ADMIN"));
  const [collectors, setCollectors] = useState<{ id: number; name: string; active?: boolean }[]>([]);
  const [collectorError, setCollectorError] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const selectedCustomer = customers.find(c => String(c.id) === form.customerId);
  const customerPurchases = sales.filter(s => s.customerId === selectedCustomer?.id);
  const matches = findCustomers(customers, customerQuery).slice(0, 10);
  function chooseCustomer(customer: Customer) {
    setForm(f => ({ ...f, customerId: String(customer.id), customerName: customer.customerName, phoneNumber: customer.phoneNumber || "", email: customer.email || "", address: customer.address || "" }));
    setCustomerQuery("");
  }
  function matchContact() {
    const match = exactContactMatch(customers, form.phoneNumber, form.email);
    if (match) chooseCustomer(match);
  }
  async function load(afterSave = false) {
    if (!afterSave) setLoading(true);
    const results = await Promise.allSettled([api.get("/api/direct-sales/customers", { timeout: 30000 }), api.get("/api/direct-sales", { timeout: 30000 })]);
    if (results[0].status === "fulfilled") setCustomers(results[0].value.data.data);
    if (results[1].status === "fulfilled") setSales(results[1].value.data.data);
    const failure = results.find(r => r.status === "rejected");
    if (failure?.status === "rejected") setError((afterSave ? "The sale was saved, but refreshing the lists failed. Use Refresh. " : "") + errorMessage(failure.reason));
    setLoading(false);
  }
  async function loadCollectors() {
    if (!isAdmin) return;
    try { const r = await api.get("/api/users", { timeout: 30000 }); setCollectors(r.data.data); setCollectorError(""); }
    catch (e) { setCollectorError("Could not load collectors. " + errorMessage(e)); }
  }
  useEffect(() => { void load(); void loadCollectors(); }, []);
  function update(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    if (["customerName", "phoneNumber", "email"].includes(key)) setCustomerQuery(value);
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (submitting.current) return;
    submitting.current = true; setBusy(true); setError(""); setMessage("");
    try {
      if(editing&&!form.customerId)throw new Error("Select an existing customer for this purchase.");
      const response = await api.request({method:editing?"put":"post",url:editing?`/api/direct-sales/${editing.id}`:"/api/direct-sales",timeout:30000,data:{ ...form, expectedFingerprint:editing?.fingerprint, saleDate:isAdmin?form.saleDate:undefined, requestKey: requestKey.current, customerId: form.customerId ? Number(form.customerId) : null,
        collectorUserId: isAdmin && form.collectorUserId ? Number(form.collectorUserId) : null,
        email: form.email || null, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice), amountCollected: Number(form.amountCollected) }});
      const saved = response.data.data as { customer: Customer; sale: Sale };
      setCustomers(list => [...list.filter(c => c.id !== saved.customer.id), saved.customer]);
      setSales(list => [saved.sale, ...list.filter(s => s.id !== saved.sale.id)]);
      requestKey.current = crypto.randomUUID(); setEditing(null); setForm({...emptyForm,saleDate:todayIndia()}); setCustomerQuery(""); setSearch(""); setHistoryCustomer("");
      setMessage("Direct sale saved for " + saved.customer.customerName + ". Customer details and purchase history are updated.");
      await load(true);
    } catch (e) { setError(errorMessage(e)); } finally { submitting.current = false; setBusy(false); }
  }
  function openSale(sale?:Sale) {
    setEditing(sale||null);setPayment(null);setError("");setMessage("");requestKey.current=crypto.randomUUID();setCustomerQuery("");
    const c=customers.find(c=>c.id===(sale?.customerId||Number(historyCustomer)));
    setForm({...emptyForm,saleDate:sale?.saleDate?.slice(0,10)||todayIndia(),customerId:c?String(c.id):"",customerName:c?.customerName||"",phoneNumber:c?.phoneNumber||"",email:c?.email||"",address:c?.address||"",collectorUserId:String(sale?.collectorUserId||""),purchaseLocation:sale?.purchaseLocation||"",productName:sale?.productName||"",quantity:String(sale?.quantity??1),unitPrice:sale?String(sale.unitPrice??sale.totalAmount/sale.quantity):"",amountCollected:sale?String(sale.amountCollected):"",remarks:sale?.remarks||""});
    formRef.current?.scrollIntoView({behavior:"smooth",block:"start"});
  }
  async function saveCustomer(event:FormEvent) {
    event.preventDefault();if(!customerEdit||submitting.current)return;submitting.current=true;setBusy(true);setError("");
    try{await api.put('/api/direct-sales/customers/'+customerEdit.id,{...customerEdit,email:customerEdit.email||null,expectedFingerprint:customerEdit.fingerprint});setCustomerEdit(null);setMessage("Customer updated across their purchase history.");await load(true);}catch(e){setError(errorMessage(e));}finally{submitting.current=false;setBusy(false);}
  }
  async function collect(event: FormEvent) {
    event.preventDefault(); if (!payment || busy) return; setBusy(true); setError("");
    try {
      await api.put(`/api/sales/${payment.sale.id}/payment`, { amountCollected: Math.round((Number(payment.sale.amountCollected) + Number(payment.amount)) * 100) / 100 });
      setPayment(null); setMessage("Collection recorded against your farm-money balance."); await load();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  const total = Math.round(Number(form.quantity) * Number(form.unitPrice) * 100) / 100;
  const catalog = customers.filter(c => [c.customerName, c.phoneNumber, c.email, c.address].some(v => v?.toLowerCase().includes(search.toLowerCase())));
  const history = sales.filter(s => !historyCustomer || s.customerId === Number(historyCustomer));
  return <section aria-label="Direct sales">
    <PageHeader title="Direct Sales & Customers" subtitle="Record a customer purchase without creating a shop. Returning customers can be found by name, phone or email." actions={<button className="admin-button admin-button-secondary" disabled={busy || loading} onClick={() => { invalidateReadCache(); setError(""); void load(); void loadCollectors(); }}>Refresh</button>} />
    {error && <p role="alert" className="money-error">{error}</p>}{message && <p role="status" className="money-success">{message}</p>}{loading && <p role="status">Loading direct sales…</p>}
    <div className="money-stats"><StatCard label="Customers" value={customers.length} /><StatCard label="Direct sales" value={rupees(sales.reduce((n, s) => n + Number(s.totalAmount), 0))} /><StatCard label="Pending collection" value={rupees(sales.reduce((n, s) => n + Number(s.pendingAmount), 0))} /></div>
    <div ref={formRef}><Panel title={editing?"Edit direct sale #"+editing.id:"New direct sale"} subtitle="For an amount-only entry, use quantity 1 and enter the sale amount as the price. Add the product or purchase description.">
      <form onSubmit={save} aria-busy={busy}>
        <fieldset className="money-form direct-sale-fields" disabled={busy || loading}>
        {isAdmin&&<Field label="Purchase date" required><input required type="date" max={todayIndia()} value={form.saleDate} onChange={e=>update("saleDate",e.target.value)}/></Field>}
        <Field label="Find an existing customer" span="full"><input type="search" autoComplete="off" placeholder="Type a name, phone number or email" value={customerQuery} onChange={e => setCustomerQuery(e.target.value)} /></Field>
        {!!customerQuery.trim() && <div className="direct-sale-matches money-wide" aria-label="Matching customers">
          {matches.length ? matches.map(c => <button type="button" className="direct-sale-match" key={c.id} onClick={() => chooseCustomer(c)}><strong>{c.customerName}</strong><span>{[c.phoneNumber, c.email, c.address].filter(Boolean).join(" · ")}</span><span>{sales.filter(s => s.customerId === c.id).length} previous purchase(s)</span></button>) : <p>No matching customer. Enter their details below to create a new customer with this sale.</p>}
        </div>}
        {selectedCustomer ? <div className="direct-sale-customer money-wide"><strong>{selectedCustomer.customerName}</strong><p>{[selectedCustomer.phoneNumber, selectedCustomer.email, selectedCustomer.address].filter(Boolean).join(" · ")}</p><p>{customerPurchases.length} previous purchase(s) · Total {rupees(customerPurchases.reduce((n, s) => n + Number(s.totalAmount), 0))}{customerPurchases[0] ? " · Last purchase " + customerPurchases[0].saleDate?.slice(0, 10) : ""}</p><button type="button" className="admin-button admin-button-secondary" onClick={() => { setForm(f => ({ ...f, customerId: "", customerName: "", phoneNumber: "", email: "", address: "" })); setCustomerQuery(""); }}>Use another / new customer</button></div> : <>
          <Field label="Customer name" required><input required maxLength={150} value={form.customerName} onChange={e => update("customerName", e.target.value)} /></Field>
          <Field label="Phone"><input type="tel" maxLength={30} value={form.phoneNumber} onChange={e => update("phoneNumber", e.target.value)} onBlur={matchContact} /></Field>
          <Field label="Email"><input type="email" maxLength={150} value={form.email} onChange={e => update("email", e.target.value)} onBlur={matchContact} /></Field>
          <Field label="Address / locality"><input maxLength={250} value={form.address} onChange={e => update("address", e.target.value)} /></Field>
        </>}
        {isAdmin && <Field label="Who collected this amount?" required><select required value={form.collectorUserId} onChange={e => update("collectorUserId", e.target.value)}><option value="">Select collector</option>{collectors.filter(c=>c.active!==false||c.id===editing?.collectorUserId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{collectorError && <small role="alert">{collectorError}</small>}</Field>}
        <Field label="Purchased at" required><input required maxLength={150} placeholder="Farm gate, market, delivery address…" value={form.purchaseLocation} onChange={e => update("purchaseLocation", e.target.value)} /></Field>
        <Field label="Product / purchase" required><input required maxLength={150} placeholder="Oyster mushrooms" value={form.productName} onChange={e => update("productName", e.target.value)} /></Field>
        <Field label="Quantity" required><input required type="number" min="0.01" max="999999" step="0.001" value={form.quantity} onChange={e => update("quantity", e.target.value)} /></Field>
        <Field label="Unit price (₹)" required><input required type="number" min="0.01" max="9999999999.99" step="0.01" value={form.unitPrice} onChange={e => update("unitPrice", e.target.value)} /></Field>
        <Field label={editing?"Total collected for this purchase (₹)":"Collected now (₹)"} required><input required type="number" min="0" max={total} step="0.01" value={form.amountCollected} onChange={e => update("amountCollected", e.target.value)} /></Field>
        <Field label="Notes"><input maxLength={500} value={form.remarks} onChange={e => update("remarks", e.target.value)} /></Field>
        <p className="money-wide">Sale total: <strong>{rupees(total)}</strong> · Pending: <strong>{rupees(Math.max(0, total - Number(form.amountCollected)))}</strong></p>
        {editing&&<p className="money-wide">Updating the collector assigns the purchase’s total collected amount to that person. Earlier receipts remain in the audit trail. Edit customer contact details in the customer catalog.</p>}
        <button type="submit" className="admin-button" disabled={busy || loading} aria-busy={busy}>{busy && <span className="direct-sale-spinner" aria-hidden="true" />}{busy ? "Saving direct sale…" : editing?"Update direct sale":"Save direct sale"}</button>
        {editing&&<button type="button" className="admin-button admin-button-secondary" onClick={()=>openSale()}>Cancel edit</button>}
        </fieldset>
        {busy && <p role="status">Saving your sale and customer details…</p>}
        {error && <p role="alert" className="money-error">{error}</p>}
        {message && <p role="status" className="money-success">{message}</p>}
      </form>
    </Panel>
    </div><Panel title="Customer catalog" subtitle="Select View purchases to see what a customer purchased and where.">
      <Field label="Find a customer"><input type="search" placeholder="Name, phone, email or locality" value={search} onChange={e => setSearch(e.target.value)} /></Field>
      <div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>History</th></tr></thead><tbody>{catalog.map(c => <tr key={c.id}><td>{c.customerName}</td><td>{c.phoneNumber || "—"}</td><td>{c.email || "—"}</td><td>{c.address || "—"}</td><td><button className="admin-button admin-button-secondary" onClick={() => setHistoryCustomer(String(c.id))}>View purchases</button>{isAdmin&&<button className="admin-button admin-button-secondary" disabled={busy} onClick={()=>{setCustomerEdit({...c});setError("");}}>Edit customer</button>}</td></tr>)}</tbody></table></div>
      {!catalog.length && <EmptyState title="No customers found" message="New customers are saved with their first direct sale." />}
    </Panel>
    <Panel title="Purchase history" actions={<button className="admin-button" disabled={busy||loading} onClick={()=>openSale()}>Add purchase</button>}>
      <Field label="Customer"><select value={historyCustomer} onChange={e => setHistoryCustomer(e.target.value)}><option value="">All customers</option>{customers.map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}</select></Field>
      <div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>Date</th><th>Customer</th><th>Purchase</th><th>Purchased at</th><th>Unit price</th><th>Notes</th><th>Total</th><th>Collected</th><th>Collector</th><th>Pending</th><th>Action</th></tr></thead><tbody>{history.map(s => <tr key={s.id}><td>{s.saleDate?.slice(0, 10)}</td><td>{s.customerName}</td><td>{s.productName} × {s.quantity}</td><td>{s.purchaseLocation}</td><td>{rupees(Number(s.unitPrice??s.totalAmount/s.quantity))}</td><td>{s.remarks||"—"}</td><td>{rupees(Number(s.totalAmount))}</td><td>{rupees(Number(s.amountCollected))}</td><td>{s.collectorName || "—"}</td><td>{rupees(Number(s.pendingAmount))}</td><td>{isAdmin&&<button type="button" className="admin-button admin-button-secondary" disabled={busy} onClick={()=>openSale(s)}>Edit purchase</button>}{s.pendingAmount > 0 && <button className="admin-button admin-button-secondary" onClick={() => setPayment({ sale: s, amount: "" })}>Collect</button>}</td></tr>)}</tbody></table></div>
      {!history.length && <EmptyState title="No direct sales yet" />}
      {payment && <form className="money-form" onSubmit={collect}><Field label={`Collect from ${payment.sale.customerName} (₹)`} required><input autoFocus required type="number" min="0.01" max={payment.sale.pendingAmount} step="0.01" value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} /></Field><button className="admin-button" disabled={busy}>Record collection</button><button type="button" className="admin-button admin-button-secondary" onClick={() => setPayment(null)}>Cancel</button></form>}
    </Panel>
  {customerEdit&&<MoneyDialog title="Edit direct customer" busy={busy} close={()=>setCustomerEdit(null)}><form onSubmit={saveCustomer}><fieldset className="money-fieldset money-form" disabled={busy}>{([['customerName','Customer name'],['phoneNumber','Phone'],['email','Email'],['address','Address / locality']] as const).map(([key,label])=><Field key={key} label={label} required={key==="customerName"}><input required={key==="customerName"} type={key==="email"?"email":key==="phoneNumber"?"tel":"text"} maxLength={key==="address"?250:key==="phoneNumber"?30:150} value={customerEdit[key]||""} onChange={e=>setCustomerEdit({...customerEdit,[key]:e.target.value})}/></Field>)}<p className="money-wide">These contact details apply to all purchases linked to this customer.</p><button className="admin-button" disabled={busy}>{busy?"Saving…":"Update customer"}</button></fieldset>{error&&<p role="alert" className="money-error">{error}</p>}</form></MoneyDialog>}
  </section>;
}

import { getStoredRoles } from "../../routes/authSession";
import { MoneySpinner, errorMessage, todayIndia } from "./MoneyPage";
import "./MoneyPage.css";
import { Fragment } from "react";
import { useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { EmptyState, Field, PageHeader, Panel } from "../components/AdminUI";
import api from "../services/api";

export default function HarvestPage({embedded=false}:{embedded?:boolean}) {
  const Wrapper=embedded?Fragment:AdminLayout;
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
  const saving=useRef(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [harvests, setHarvests] = useState<any[]>([]);
  const [harvestDate,setHarvestDate]=useState(todayIndia);
  const [editing,setEditing]=useState<number|null>(null);
  const admin=getStoredRoles().includes("SUPER_ADMIN");
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const batchResponse = await api.get("/api/production");
      const harvestResponse = await api.get("/api/harvest");

      setBatches(batchResponse.data.data);
      setHarvests(harvestResponse.data.data);
    } catch (error) {
      setError(errorMessage(error));
    }
  };

  const saveHarvest = async () => {
    if(saving.current)return;
    if(!harvestDate || !Number.isFinite(Number(quantity)) || Number(quantity)<=0){setError("Enter a harvest date and a quantity greater than zero.");return;}
    try {
      saving.current=true;setBusy(true);setError("");setMessage("");
      await api.request({method:editing?"put":"post",url:editing?`/api/harvest/${editing}`:"/api/harvest",data:{
          batchId: batchId ? Number(batchId) : null,
          harvestDate,
          quantity: Number(quantity),
          remarks
        }}
      );

      setMessage("Harvest saved successfully.");

      setEditing(null);setHarvestDate(todayIndia());
      setBatchId("");
      setQuantity("");
      setRemarks("");

      await loadData();
    } catch (error: any) {
      setError(errorMessage(error));
    } finally { saving.current=false;setBusy(false); }
  };

  const totalHarvest = harvests.reduce(
    (total, harvest) => total + (Number(harvest.quantity) || 0),
    0
  );

  return (
    <Wrapper>
      {error&&<p className="money-error" role="alert">{error}</p>}{message&&<p className="money-success" role="status">{message}</p>}
      <PageHeader
        eyebrow="Harvest"
        title="Harvest Management"
        subtitle="Record daily harvest totals, with or without a production batch."
      />

<div style={{overflowX:"auto",marginBottom:20}}><table className="money-table"><thead><tr><th>Harvest records</th><th>Total harvested kg</th></tr></thead><tbody><tr><td>{harvests.length}</td><td>{totalHarvest}</td></tr></tbody></table></div>

      <Panel
        title={editing ? "Edit Harvest" : "Record Harvest"}
        subtitle="Choose the harvest date and quantity. Batch is optional for combined or untracked harvests."
      >
        <fieldset disabled={busy} className="admin-form-grid money-fieldset">
          <Field label="Harvest date"><input required type="date" max={todayIndia()} value={harvestDate} onChange={e=>setHarvestDate(e.target.value)}/></Field>
          <Field label="Batch (optional)">
            <select
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
            >
              <option value="">No batch / combined harvest</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchCode}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quantity KG">
            <input
              type="number" min="0.001" step="0.001"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>

          <Field label="Remarks">
            <input
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </Field>

          <button className="admin-button" type="button" onClick={saveHarvest}>
            {busy?<MoneySpinner/>:<Save size={17}/>}
            {busy?"Saving…":editing?"Update Harvest":"Save Harvest"}
          </button>
          {editing&&<button type="button" className="admin-button admin-button-secondary" onClick={()=>{setEditing(null);setBatchId("");setQuantity("");setRemarks("");setHarvestDate(todayIndia());setError("");}}>Cancel edit</button>}
        </fieldset>
      </Panel>

      <Panel
        title="Harvest Records"
        subtitle="Harvest history by date, including combined harvests without a batch."
      >
        {harvests.length === 0 && (
          <EmptyState
            title="No harvest records yet"
            message="Save a harvest entry above to begin tracking output."
          />
        )}

        {harvests.length > 0 && (
<div style={{overflowX:"auto"}}><table className="money-table"><thead><tr><th>Date</th><th>Batch</th><th>Quantity (kg)</th><th>Remarks</th><th>Action</th></tr></thead><tbody>{[...harvests].sort((a,b)=>(b.harvestDate||"").localeCompare(a.harvestDate||"")||b.id-a.id).map(harvest=><tr key={harvest.id}><td>{harvest.harvestDate||"—"}</td><td>{harvest.batchCode||"No batch / combined"}</td><td>{harvest.quantity}</td><td style={{whiteSpace:"normal"}}>{harvest.remarks||"—"}</td><td>{admin&&<button type="button" disabled={busy} className="admin-button admin-button-secondary" onClick={()=>{setEditing(harvest.id);setBatchId(harvest.batchId?String(harvest.batchId):"");setHarvestDate(harvest.harvestDate||todayIndia());setQuantity(String(harvest.quantity));setRemarks(harvest.remarks||"");setError("");setMessage("");}}>Edit</button>}</td></tr>)}</tbody></table></div>
        )}
      </Panel>
    </Wrapper>
  );
}

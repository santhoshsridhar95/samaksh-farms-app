import { WorkAttribution, WorkerName } from "../components/WorkAttribution";
import { MoneySpinner, errorMessage, todayIndia } from "./MoneyPage";
import "./MoneyPage.css";
import { Fragment } from "react";
import { useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { EmptyState, Field, PageHeader, Panel } from "../components/AdminUI";
import api from "../services/api";

export default function RoomTransferPage({embedded=false}:{embedded?:boolean}) {
  const Wrapper=embedded?Fragment:AdminLayout;
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
  const saving=useRef(false);
  const [performedByEmployeeId,setPerformedByEmployeeId]=useState("");
  const [batches, setBatches] = useState<any[]>([]);
  const [movements,setMovements]=useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [movedToLightRoom, setMovedToLightRoom] = useState("");
  const [contaminatedBags, setContaminatedBags] = useState("");
  const [discardedBags, setDiscardedBags] = useState("");
  const [movementDate,setMovementDate]=useState(todayIndia);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const [response,history] = await Promise.all([api.get("/api/production"),api.get("/api/production-movements")]);
      setMovements(history.data.data);
      setBatches(response.data.data);
    } catch (error) {
      setError(errorMessage(error));
    }
  };

  const transfer = async () => {
    if(saving.current)return;
    if (!selectedBatchId) {
      alert("Please select a batch");
      return;
    }

    try {
      saving.current=true;setBusy(true);setError("");setMessage("");
      await api.put(
        `/api/production/${selectedBatchId}/transfer-light-room`,
        {
          movementDate,
          movedToLightRoom: movedToLightRoom ? Number(movedToLightRoom) : 0,
          contaminatedBags: contaminatedBags ? Number(contaminatedBags) : 0,
          discardedBags: discardedBags ? Number(discardedBags) : 0,
          performedByEmployeeId: performedByEmployeeId ? Number(performedByEmployeeId) : null,
          remarks
        }
      );

      setMessage("Transfer saved successfully.");

      setMovedToLightRoom("");
      setContaminatedBags("");
      setDiscardedBags("");
      setRemarks("");setPerformedByEmployeeId("");

      await loadBatches();
    } catch (error: any) {
      setError(errorMessage(error));
    } finally { saving.current=false;setBusy(false); }
  };

  const darkRoomTotal = batches.reduce(
    (total, batch) => total + (Number(batch.darkRoomBags) || 0),
    0
  );

  const lightRoomTotal = batches.reduce(
    (total, batch) => total + (Number(batch.lightRoomBags) || 0),
    0
  );

  const lossTotal = batches.reduce(
    (total, batch) =>
      total +
      (Number(batch.contaminatedBags) || 0) +
      (Number(batch.discardedBags) || 0),
    0
  );

  return (
    <Wrapper>
      {error&&<p className="money-error" role="alert">{error}</p>}{message&&<p className="money-success" role="status">{message}</p>}
      <PageHeader
        eyebrow="Room Transfer"
        title="Room Transfer"
        subtitle="Move bags from dark room to light room and capture losses cleanly."
      />

<div style={{overflowX:"auto",marginBottom:20}}><table className="money-table"><thead><tr><th>Dark room bags</th><th>Light room bags</th><th>Recorded loss</th></tr></thead><tbody><tr><td>{darkRoomTotal}</td><td>{lightRoomTotal}</td><td>{lossTotal}</td></tr></tbody></table></div>

      <Panel
        title="Transfer Bags To Light Room"
        subtitle="Select the batch and enter moved, contaminated, and discarded bag counts."
      >
        <fieldset disabled={busy} className="admin-form-grid money-fieldset">
          <Field label="Movement date"><input required type="date" max={todayIndia()} value={movementDate} onChange={e=>setMovementDate(e.target.value)}/></Field><Field label="Batch">
            <select
              value={selectedBatchId}
              onChange={(event) => setSelectedBatchId(event.target.value)}
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchCode} | Dark Room: {batch.darkRoomBags}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Moved To Light Room">
            <input
              type="number" min="0"
              value={movedToLightRoom}
              onChange={(event) => setMovedToLightRoom(event.target.value)}
            />
          </Field>

          <Field label="Contaminated Bags">
            <input
              type="number" min="0"
              value={contaminatedBags}
              onChange={(event) => setContaminatedBags(event.target.value)}
            />
          </Field>

          <Field label="Discarded Bags">
            <input
              type="number" min="0"
              value={discardedBags}
              onChange={(event) => setDiscardedBags(event.target.value)}
            />
          </Field>

          <WorkAttribution value={performedByEmployeeId} onChange={setPerformedByEmployeeId}/><Field label="Remarks">
            <input
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </Field>

          <button className="admin-button" type="button" onClick={transfer}>
            {busy?<MoneySpinner/>:<Save size={17}/>}
            Transfer
          </button>
        </fieldset>
      </Panel>

      <Panel
        title="Batch Room Status"
        subtitle="Current room position and loss counts for each batch."
      >
        {batches.length === 0 && (
          <EmptyState
            title="No batches available"
            message="Create production batches before recording room transfers."
          />
        )}

        {batches.length > 0 && (
<div style={{overflowX:"auto"}}><table className="money-table"><thead><tr><th>Batch</th><th>Status</th><th>Dark room</th><th>Light room</th><th>Contaminated</th><th>Discarded</th></tr></thead><tbody>{batches.map(batch=><tr key={batch.id}><td>{batch.batchCode}</td><td>{batch.status}</td><td>{batch.darkRoomBags}</td><td>{batch.lightRoomBags}</td><td>{batch.contaminatedBags}</td><td>{batch.discardedBags}</td></tr>)}</tbody></table></div>
        )}
      </Panel>
    <Panel title="Room transfer history"><div className="admin-table-wrapper"><table className="money-table"><thead><tr><th>Date / batch</th><th>Moved bags</th><th>Contaminated / discarded</th><th>Work done by</th></tr></thead><tbody>{[...movements].sort((a,b)=>b.id-a.id).map(m=><tr key={m.id}><td>{m.movementDate?.slice(0,10)}<small>{m.batchCode}</small></td><td>{m.movedToLightRoom}</td><td>{m.contaminatedBags} / {m.discardedBags}</td><td><WorkerName id={m.performedByEmployeeId}/></td></tr>)}</tbody></table></div>{!movements.length&&<EmptyState title="No room transfers yet"/>}</Panel>
    </Wrapper>
  );
}

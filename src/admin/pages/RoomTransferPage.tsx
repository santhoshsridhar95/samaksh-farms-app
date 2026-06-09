import { useEffect, useState } from "react";
import { AlertTriangle, Repeat2, Save, Sprout } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { EmptyState, Field, PageHeader, Panel, StatCard, StatusPill } from "../components/AdminUI";
import api from "../services/api";

export default function RoomTransferPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [movedToLightRoom, setMovedToLightRoom] = useState("");
  const [contaminatedBags, setContaminatedBags] = useState("");
  const [discardedBags, setDiscardedBags] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const response = await api.get("/api/production");
      setBatches(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const transfer = async () => {
    if (!selectedBatchId) {
      alert("Please select a batch");
      return;
    }

    try {
      await api.put(
        `/api/production/${selectedBatchId}/transfer-light-room`,
        {
          movedToLightRoom: movedToLightRoom ? Number(movedToLightRoom) : 0,
          contaminatedBags: contaminatedBags ? Number(contaminatedBags) : 0,
          discardedBags: discardedBags ? Number(discardedBags) : 0,
          remarks
        }
      );

      alert("Transfer successful");

      setMovedToLightRoom("");
      setContaminatedBags("");
      setDiscardedBags("");
      setRemarks("");

      loadBatches();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || "Transfer failed");
    }
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
    <AdminLayout>
      <PageHeader
        eyebrow="Room Transfer"
        title="Room Transfer"
        subtitle="Move bags from dark room to light room and capture losses cleanly."
      />

      <div className="admin-stat-grid">
        <StatCard
          label="Dark Room"
          value={darkRoomTotal}
          icon={<Sprout size={20} />}
          tone="slate"
        />
        <StatCard
          label="Light Room"
          value={lightRoomTotal}
          icon={<Repeat2 size={20} />}
          tone="blue"
        />
        <StatCard
          label="Recorded Loss"
          value={lossTotal}
          icon={<AlertTriangle size={20} />}
          tone="red"
        />
      </div>

      <Panel
        title="Transfer Bags To Light Room"
        subtitle="Select the batch and enter moved, contaminated, and discarded bag counts."
      >
        <div className="admin-form-grid">
          <Field label="Batch">
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
              type="number"
              value={movedToLightRoom}
              onChange={(event) => setMovedToLightRoom(event.target.value)}
            />
          </Field>

          <Field label="Contaminated Bags">
            <input
              type="number"
              value={contaminatedBags}
              onChange={(event) => setContaminatedBags(event.target.value)}
            />
          </Field>

          <Field label="Discarded Bags">
            <input
              type="number"
              value={discardedBags}
              onChange={(event) => setDiscardedBags(event.target.value)}
            />
          </Field>

          <Field label="Remarks">
            <input
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </Field>

          <button className="admin-button" type="button" onClick={transfer}>
            <Save size={17} />
            Transfer
          </button>
        </div>
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
          <div className="admin-record-grid">
            {batches.map((batch) => (
              <article className="admin-record-card" key={batch.id}>
                <header>
                  <div>
                    <h3>{batch.batchCode}</h3>
                    <small>Room movement status</small>
                  </div>
                  <StatusPill status={batch.status} />
                </header>

                <div className="admin-record-details">
                  <div>
                    <span>Dark Room</span>
                    <strong>{batch.darkRoomBags}</strong>
                  </div>
                  <div>
                    <span>Light Room</span>
                    <strong>{batch.lightRoomBags}</strong>
                  </div>
                  <div>
                    <span>Contaminated</span>
                    <strong>{batch.contaminatedBags}</strong>
                  </div>
                  <div>
                    <span>Discarded</span>
                    <strong>{batch.discardedBags}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </AdminLayout>
  );
}

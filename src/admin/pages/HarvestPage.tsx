import { useEffect, useState } from "react";
import { Scale, Save, Sprout } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { EmptyState, Field, PageHeader, Panel, StatCard } from "../components/AdminUI";
import api from "../services/api";

export default function HarvestPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [harvests, setHarvests] = useState<any[]>([]);
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
      console.error(error);
    }
  };

  const saveHarvest = async () => {
    try {
      await api.post(
        "/api/harvest",
        {
          batchId: Number(batchId),
          quantity: Number(quantity),
          remarks
        }
      );

      alert("Harvest saved successfully");

      setBatchId("");
      setQuantity("");
      setRemarks("");

      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to save harvest");
    }
  };

  const totalHarvest = harvests.reduce(
    (total, harvest) => total + (Number(harvest.quantity) || 0),
    0
  );

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Harvest"
        title="Harvest Management"
        subtitle="Record harvest quantities against production batches with clear traceability."
      />

      <div className="admin-stat-grid">
        <StatCard
          label="Harvest Records"
          value={harvests.length}
          icon={<Sprout size={20} />}
          tone="blue"
        />
        <StatCard
          label="Total Harvest KG"
          value={totalHarvest}
          icon={<Scale size={20} />}
          tone="green"
        />
      </div>

      <Panel
        title="Record Harvest"
        subtitle="Choose the production batch and capture the harvested quantity."
      >
        <div className="admin-form-grid">
          <Field label="Batch">
            <select
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchCode}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quantity KG">
            <input
              type="number"
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
            <Save size={17} />
            Save Harvest
          </button>
        </div>
      </Panel>

      <Panel
        title="Harvest Records"
        subtitle="Batch-level output captured as concise records."
      >
        {harvests.length === 0 && (
          <EmptyState
            title="No harvest records yet"
            message="Save a harvest entry above to begin tracking output."
          />
        )}

        {harvests.length > 0 && (
          <div className="admin-record-grid">
            {harvests.map((harvest) => (
              <article className="admin-record-card" key={harvest.id}>
                <header>
                  <div>
                    <h3>{harvest.batchCode}</h3>
                    <small>Harvest #{harvest.id}</small>
                  </div>
                </header>

                <div className="admin-record-details">
                  <div>
                    <span>Quantity KG</span>
                    <strong>{harvest.quantity}</strong>
                  </div>
                  <div>
                    <span>Remarks</span>
                    <strong>{harvest.remarks || "No remarks"}</strong>
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

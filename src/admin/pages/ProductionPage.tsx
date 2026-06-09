import { useEffect, useState } from "react";
import { Factory, Package, Save, Sprout, Trash2 } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import { EmptyState, Field, PageHeader, Panel, StatCard, StatusPill } from "../components/AdminUI";
import api from "../services/api";

export default function ProductionPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [mushroomType, setMushroomType] = useState("OYSTER");
  const [bagsPrepared, setBagsPrepared] = useState("");
  const [damagedCovers, setDamagedCovers] = useState("");
  const [damagedSpawnKg, setDamagedSpawnKg] = useState("");
  const [damagedPelletsKg, setDamagedPelletsKg] = useState("");
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

  const createBatch = async () => {
    try {
      await api.post(
        "/api/production",
        {
          mushroomType,
          bagsPrepared: Number(bagsPrepared),
          damagedCovers: damagedCovers ? Number(damagedCovers) : 0,
          damagedSpawnKg: damagedSpawnKg ? Number(damagedSpawnKg) : 0,
          damagedPelletsKg: damagedPelletsKg ? Number(damagedPelletsKg) : 0,
          remarks
        }
      );

      alert("Batch created successfully");

      setBagsPrepared("");
      setDamagedCovers("");
      setDamagedSpawnKg("");
      setDamagedPelletsKg("");
      setRemarks("");

      loadBatches();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to create batch");
    }
  };

  const totalBags = batches.reduce(
    (total, batch) => total + (Number(batch.bagsUsed) || 0),
    0
  );

  const lightRoomTotal = batches.reduce(
    (total, batch) => total + (Number(batch.lightRoomBags) || 0),
    0
  );

  const discardedTotal = batches.reduce(
    (total, batch) => total + (Number(batch.discardedBags) || 0),
    0
  );

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Production"
        title="Production Management"
        subtitle="Create batches and monitor bag movement through the production cycle."
      />

      <div className="admin-stat-grid">
        <StatCard
          label="Batches"
          value={batches.length}
          icon={<Factory size={20} />}
          tone="blue"
        />
        <StatCard
          label="Bags Prepared"
          value={totalBags}
          icon={<Package size={20} />}
          tone="green"
        />
        <StatCard
          label="Light Room"
          value={lightRoomTotal}
          icon={<Sprout size={20} />}
          tone="amber"
        />
        <StatCard
          label="Discarded"
          value={discardedTotal}
          icon={<Trash2 size={20} />}
          tone="red"
        />
      </div>

      <Panel
        title="Create Batch"
        subtitle="Capture production inputs and any damaged materials in one clean form."
      >
        <div className="admin-form-grid">
          <Field label="Mushroom Type">
            <select
              value={mushroomType}
              onChange={(event) => setMushroomType(event.target.value)}
            >
              <option value="OYSTER">Oyster</option>
              <option value="BUTTON">Button</option>
              <option value="MILKY">Milky</option>
            </select>
          </Field>

          <Field label="Bags Prepared">
            <input
              type="number"
              value={bagsPrepared}
              onChange={(event) => setBagsPrepared(event.target.value)}
            />
          </Field>

          <Field label="Damaged Covers">
            <input
              type="number"
              value={damagedCovers}
              onChange={(event) => setDamagedCovers(event.target.value)}
            />
          </Field>

          <Field label="Damaged Spawn KG">
            <input
              type="number"
              value={damagedSpawnKg}
              onChange={(event) => setDamagedSpawnKg(event.target.value)}
            />
          </Field>

          <Field label="Damaged Pellets KG">
            <input
              type="number"
              value={damagedPelletsKg}
              onChange={(event) => setDamagedPelletsKg(event.target.value)}
            />
          </Field>

          <Field label="Remarks">
            <input
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </Field>

          <button className="admin-button" type="button" onClick={createBatch}>
            <Save size={17} />
            Create Batch
          </button>
        </div>
      </Panel>

      <Panel
        title="Production Batches"
        subtitle="Batch cards replace dense tables for faster scanning."
      >
        {batches.length === 0 && (
          <EmptyState
            title="No batches yet"
            message="Create the first production batch to start tracking room movement."
          />
        )}

        {batches.length > 0 && (
          <div className="admin-record-grid">
            {batches.map((batch) => (
              <article className="admin-record-card" key={batch.id}>
                <header>
                  <div>
                    <h3>{batch.batchCode}</h3>
                    <small>{batch.mushroomType}</small>
                  </div>
                  <StatusPill status={batch.status} />
                </header>

                <div className="admin-record-details">
                  <div>
                    <span>Spawn Used</span>
                    <strong>{batch.spawnUsed}</strong>
                  </div>
                  <div>
                    <span>Pellets Used</span>
                    <strong>{batch.pelletsUsed}</strong>
                  </div>
                  <div>
                    <span>Bags</span>
                    <strong>{batch.bagsUsed}</strong>
                  </div>
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

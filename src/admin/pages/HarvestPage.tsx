import { useEffect, useState } from "react";

import AdminLayout
  from "../components/AdminLayout";

import api
  from "../services/api";

export default function HarvestPage() {

  const [batches, setBatches] =
    useState<any[]>([]);

  const [harvests, setHarvests] =
    useState<any[]>([]);

  const [batchId, setBatchId] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  useEffect(() => {

    loadData();

  }, []);

  const loadData =
    async () => {

      try {

        const batchResponse =
          await api.get(
            "/api/production"
          );

        const harvestResponse =
          await api.get(
            "/api/harvest"
          );

        setBatches(
          batchResponse.data.data
        );

        setHarvests(
          harvestResponse.data.data
        );

      } catch (error) {

        console.error(error);

      }
    };

  const saveHarvest =
    async () => {

      try {

        await api.post(
          "/api/harvest",
          {
            batchId:
              Number(batchId),

            quantity:
              Number(quantity),

            remarks
          }
        );

        alert(
          "Harvest saved successfully"
        );

        setBatchId("");
        setQuantity("");
        setRemarks("");

        loadData();

      } catch (error: any) {

        console.error(error);

        alert(
          error?.response?.data?.message
          || "Failed to save harvest"
        );
      }
    };

  return (

    <AdminLayout>

      <h1>
        Harvest Management
      </h1>

      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px"
        }}
      >

        <h3>
          Record Harvest
        </h3>

        <div>

          <label>
            Batch
          </label>

          <br />

          <select
            value={batchId}
            onChange={(e) =>
              setBatchId(
                e.target.value
              )
            }
          >

            <option value="">
              Select Batch
            </option>

            {batches.map(
              (batch) => (

                <option
                  key={batch.id}
                  value={batch.id}
                >
                  {batch.batchCode}
                </option>

              )
            )}

          </select>

        </div>

        <br />

        <div>

          <label>
            Quantity (KG)
          </label>

          <br />

          <input
            type="number"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value
              )
            }
          />

        </div>

        <br />

        <div>

          <label>
            Remarks
          </label>

          <br />

          <input
            value={remarks}
            onChange={(e) =>
              setRemarks(
                e.target.value
              )
            }
          />

        </div>

        <br />

        <button
          onClick={
            saveHarvest
          }
        >
          Save Harvest
        </button>

      </div>

      <table
        border={1}
        cellPadding={10}
        style={{
          width: "100%"
        }}
      >

        <thead>

        <tr>

          <th>ID</th>

          <th>Batch</th>

          <th>Quantity KG</th>

          <th>Remarks</th>

        </tr>

        </thead>

        <tbody>

        {harvests.map(
          (harvest) => (

            <tr
              key={
                harvest.id
              }
            >

              <td>
                {harvest.id}
              </td>

              <td>
                {harvest.batchCode}
              </td>

              <td>
                {harvest.quantity}
              </td>

              <td>
                {harvest.remarks}
              </td>

            </tr>

          )
        )}

        </tbody>

      </table>

    </AdminLayout>
  );
}
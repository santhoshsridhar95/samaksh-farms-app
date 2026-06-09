import { useEffect, useState } from "react";

import AdminLayout
  from "../components/AdminLayout";

import api
  from "../services/api";

export default function RoomTransferPage() {

  const [batches, setBatches] =
    useState<any[]>([]);

  const [selectedBatchId, setSelectedBatchId] =
    useState("");

  const [movedToLightRoom, setMovedToLightRoom] =
    useState("");

  const [contaminatedBags, setContaminatedBags] =
    useState("");

  const [discardedBags, setDiscardedBags] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  useEffect(() => {

    loadBatches();

  }, []);

  const loadBatches =
    async () => {

      try {

        const response =
          await api.get(
            "/api/production"
          );

        setBatches(
          response.data.data
        );

      } catch (error) {

        console.error(error);

      }
    };

  const transfer =
    async () => {

      if (!selectedBatchId) {

        alert(
          "Please select a batch"
        );

        return;
      }

      try {

        await api.put(
          `/api/production/${selectedBatchId}/transfer-light-room`,
          {
            movedToLightRoom:
              movedToLightRoom
                ? Number(
                    movedToLightRoom
                  )
                : 0,

            contaminatedBags:
              contaminatedBags
                ? Number(
                    contaminatedBags
                  )
                : 0,

            discardedBags:
              discardedBags
                ? Number(
                    discardedBags
                  )
                : 0,

            remarks
          }
        );

        alert(
          "Transfer successful"
        );

        setMovedToLightRoom("");
        setContaminatedBags("");
        setDiscardedBags("");
        setRemarks("");

        loadBatches();

      } catch (error: any) {

        console.error(error);

        alert(
          error?.response?.data?.message
          || "Transfer failed"
        );
      }
    };

  return (

    <AdminLayout>

      <h1>
        Room Transfer
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
          Transfer Bags To Light Room
        </h3>

        <div>

          <label>
            Batch
          </label>

          <br />

          <select
            value={selectedBatchId}
            onChange={(e) =>
              setSelectedBatchId(
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
                  {" | Dark Room : "}
                  {batch.darkRoomBags}
                </option>

              )
            )}

          </select>

        </div>

        <br />

        <div>

          <label>
            Moved To Light Room
          </label>

          <br />

          <input
            type="number"
            value={movedToLightRoom}
            onChange={(e) =>
              setMovedToLightRoom(
                e.target.value
              )
            }
          />

        </div>

        <br />

        <div>

          <label>
            Contaminated Bags
          </label>

          <br />

          <input
            type="number"
            value={contaminatedBags}
            onChange={(e) =>
              setContaminatedBags(
                e.target.value
              )
            }
          />

        </div>

        <br />

        <div>

          <label>
            Discarded Bags
          </label>

          <br />

          <input
            type="number"
            value={discardedBags}
            onChange={(e) =>
              setDiscardedBags(
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
          onClick={transfer}
        >
          Transfer
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

          <th>Batch</th>

          <th>Dark Room</th>

          <th>Light Room</th>

          <th>Contaminated</th>

          <th>Discarded</th>

          <th>Status</th>

        </tr>

        </thead>

        <tbody>

        {batches.map(
          (batch) => (

            <tr
              key={batch.id}
            >

              <td>
                {batch.batchCode}
              </td>

              <td>
                {batch.darkRoomBags}
              </td>

              <td>
                {batch.lightRoomBags}
              </td>

              <td>
                {batch.contaminatedBags}
              </td>

              <td>
                {batch.discardedBags}
              </td>

              <td>
                {batch.status}
              </td>

            </tr>

          )
        )}

        </tbody>

      </table>

    </AdminLayout>
  );
}
import { useState } from "react";
import { Save } from "lucide-react";

import { Field, Panel } from "./AdminUI";
import api from "../services/api";

type Props = {
  onSuccess: () => void;
};

export default function AddInventoryModal({ onSuccess }: Props) {
  const [inventoryType, setInventoryType] = useState("SPAWN");
  const [transactionType, setTransactionType] = useState("PURCHASE");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  const save = async () => {
    try {
      await api.post(
        "/api/inventory-transactions",
        {
          inventoryType,
          transactionType,
          quantity: Number(quantity),
          remarks
        }
      );

      alert("Inventory added successfully");

      setQuantity("");
      setRemarks("");
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to save inventory");
    }
  };

  return (
    <Panel
      title="Add Inventory"
      subtitle="Record purchases and damages as structured stock movements."
    >
      <div className="admin-form-grid">
        <Field label="Inventory Type">
          <select
            value={inventoryType}
            onChange={(event) => setInventoryType(event.target.value)}
          >
            <option value="SPAWN">Spawn</option>
            <option value="PELLET">Pellet</option>
            <option value="BAG">Bag</option>
          </select>
        </Field>

        <Field label="Transaction Type">
          <select
            value={transactionType}
            onChange={(event) => setTransactionType(event.target.value)}
          >
            <option value="PURCHASE">Purchase</option>
            <option value="DAMAGE">Damage</option>
          </select>
        </Field>

        <Field label="Quantity">
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

        <button className="admin-button" type="button" onClick={save}>
          <Save size={17} />
          Save Inventory
        </button>
      </div>
    </Panel>
  );
}

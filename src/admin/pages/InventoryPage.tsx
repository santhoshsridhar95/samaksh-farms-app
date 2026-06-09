import { useEffect, useState } from "react";
import { Boxes, Hash, PackageCheck } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import AddInventoryModal from "../components/AddInventoryModal";
import { EmptyState, PageHeader, Panel, StatCard, StatusPill } from "../components/AdminUI";
import api from "../services/api";

export default function InventoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await api.get("/api/inventory-transactions");
      setTransactions(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = transactions.reduce(
    (total, transaction) => total + (Number(transaction.quantity) || 0),
    0
  );

  const purchaseCount = transactions.filter(
    (transaction) => transaction.transactionType === "PURCHASE"
  ).length;

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Inventory"
        title="Inventory Management"
        subtitle="Track spawn, pellet, and bag movements with cleaner stock records."
      />

      <div className="admin-stat-grid">
        <StatCard
          label="Transactions"
          value={transactions.length}
          icon={<Hash size={20} />}
          tone="blue"
          helper="Total stock movements"
        />

        <StatCard
          label="Purchase Entries"
          value={purchaseCount}
          icon={<PackageCheck size={20} />}
          tone="green"
          helper="Incoming inventory records"
        />

        <StatCard
          label="Quantity Logged"
          value={totalQuantity}
          icon={<Boxes size={20} />}
          tone="slate"
          helper="Across all inventory types"
        />
      </div>

      <AddInventoryModal onSuccess={loadTransactions} />

      <Panel
        title="Inventory Ledger"
        subtitle="Recent movement records shown as scannable cards."
      >
        {loading && <div className="admin-loading">Loading inventory records...</div>}

        {!loading && transactions.length === 0 && (
          <EmptyState
            title="No inventory transactions yet"
            message="Add the first stock movement above to begin the ledger."
          />
        )}

        {!loading && transactions.length > 0 && (
          <div className="admin-record-grid">
            {transactions.map((transaction) => (
              <article className="admin-record-card" key={transaction.id}>
                <header>
                  <div>
                    <h3>{transaction.inventoryType}</h3>
                    <small>Transaction #{transaction.id}</small>
                  </div>

                  <StatusPill status={transaction.transactionType} />
                </header>

                <div className="admin-record-details">
                  <div>
                    <span>Quantity</span>
                    <strong>{transaction.quantity}</strong>
                  </div>
                  <div>
                    <span>Remarks</span>
                    <strong>{transaction.remarks || "No remarks"}</strong>
                  </div>
                  <div>
                    <span>User</span>
                    <strong>{transaction.createdByEmail || "System"}</strong>
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

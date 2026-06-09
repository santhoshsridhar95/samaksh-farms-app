import { useEffect, useState } from "react";
import { IndianRupee, Receipt, Save, WalletCards } from "lucide-react";

import AdminLayout from "../components/AdminLayout";
import {
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
} from "../components/AdminUI";
import api from "../services/api";

export default function SalesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const customerResponse = await api.get("/api/customers");
      const productResponse = await api.get("/api/products");
      const salesResponse = await api.get("/api/sales");

      setCustomers(customerResponse?.data?.data?.content || []);

      setProducts(productResponse.data.data);

      setSales(salesResponse?.data?.data?.content || []);
    } catch (error) {
      console.error(error);
    }
  };

  const createSale = async () => {
    try {
      await api.post("/api/sales", {
        customerId: Number(customerId),
        productId: Number(productId),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        paymentStatus,
        remarks,
      });

      alert("Sale created successfully");

      setCustomerId("");
      setProductId("");
      setQuantity("");
      setUnitPrice("");
      setPaymentStatus("PENDING");
      setRemarks("");

      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to create sale");
    }
  };

  const totalRevenue = (sales || []).reduce(
    (total, sale) => total + (Number(sale.totalAmount) || 0),
    0,
  );

  const paidSales = (sales || []).filter(
    (sale) => sale.paymentStatus === "PAID",
  ).length;
  const pendingSales = (sales || []).filter(
    (sale) => sale.paymentStatus !== "PAID",
  ).length;

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Sales"
        title="Sales Management"
        subtitle="Record direct sales and monitor payment status without digging through rows."
      />

      <div className="admin-stat-grid">
        <StatCard
          label="Total Revenue"
          value={`Rs. ${totalRevenue}`}
          icon={<IndianRupee size={20} />}
          tone="green"
        />
        <StatCard
          label="Sales Records"
          value={sales.length}
          icon={<Receipt size={20} />}
          tone="blue"
        />
        <StatCard
          label="Paid"
          value={paidSales}
          icon={<WalletCards size={20} />}
          tone="violet"
        />
        <StatCard
          label="Pending"
          value={pendingSales}
          icon={<WalletCards size={20} />}
          tone="amber"
        />
      </div>

      <Panel
        title="Create Sale"
        subtitle="Log product, quantity, unit price, and payment status together."
      >
        <div className="admin-form-grid">
          <Field label="Customer">
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="">Select Customer</option>
              {(customers || []).map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customerName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Product">
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <option value="">Select Product</option>
              {(products || []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.productName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quantity">
            <input
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>

          <Field label="Unit Price">
            <input
              type="number"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
            />
          </Field>

          <Field label="Payment Status">
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
            >
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </Field>

          <Field label="Remarks">
            <input
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </Field>

          <button className="admin-button" type="button" onClick={createSale}>
            <Save size={17} />
            Create Sale
          </button>
        </div>
      </Panel>

      <Panel
        title="Sales Ledger"
        subtitle="Payment and revenue information grouped per sale."
      >
        {sales.length === 0 && (
          <EmptyState
            title="No sales yet"
            message="Create a sale above to start building the sales ledger."
          />
        )}

        {sales.length > 0 && (
          <div className="admin-record-grid">
            {(sales || []).map((sale) => (
              <article className="admin-record-card" key={sale.id}>
                <header>
                  <div>
                    <h3>{sale.customerName}</h3>
                    <small>{sale.productName}</small>
                  </div>
                  <StatusPill status={sale.paymentStatus} />
                </header>

                <div className="admin-record-details">
                  <div>
                    <span>Quantity</span>
                    <strong>{sale.quantity}</strong>
                  </div>
                  <div>
                    <span>Unit Price</span>
                    <strong>Rs. {sale.unitPrice}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>Rs. {sale.totalAmount}</strong>
                  </div>
                  <div>
                    <span>Remarks</span>
                    <strong>{sale.remarks || "No remarks"}</strong>
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

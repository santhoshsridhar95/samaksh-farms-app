import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, Save, ShoppingBag } from "lucide-react";

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

export default function OrderPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expectedUnitPrice, setExpectedUnitPrice] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const customerResponse = await api.get("/api/customers");

      const productResponse = await api.get("/api/products");

      const orderResponse = await api.get("/api/orders");

      console.log("CUSTOMERS", customerResponse.data);

      console.log("PRODUCTS", productResponse.data);

      console.log("ORDERS", orderResponse.data);

      setCustomers(customerResponse?.data?.data?.content || []);

      setProducts(productResponse.data.data);

      setOrders(orderResponse?.data?.data?.content || []);
    } catch (error) {
      console.error(error);

      setCustomers([]);
      setProducts([]);
      setOrders([]);
    }
  };

  const createOrder = async () => {
    try {
      await api.post("/api/orders", {
        customerId: Number(customerId),
        productId: Number(productId),
        quantity: Number(quantity),
        expectedUnitPrice: Number(expectedUnitPrice),
        expectedDeliveryDate,
        remarks,
      });

      alert("Order created successfully");

      setCustomerId("");
      setProductId("");
      setQuantity("");
      setExpectedUnitPrice("");
      setExpectedDeliveryDate("");
      setRemarks("");

      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to create order");
    }
  };

  const expectedAmount = Array.isArray(orders)
    ? orders.reduce(
        (total, order) => total + (Number(order.expectedAmount) || 0),
        0,
      )
    : 0;
  const pendingOrders = Array.isArray(orders)
    ? orders.filter((order) =>
        String(order.status).toLowerCase().includes("pending"),
      ).length
    : 0;

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Orders"
        title="Customer Orders"
        subtitle="Create customer commitments and review expected fulfilment at a glance."
      />

      <div className="admin-stat-grid">
        <StatCard
          label="Orders"
          value={orders.length}
          icon={<ClipboardList size={20} />}
          tone="blue"
        />
        <StatCard
          label="Expected Value"
          value={`Rs. ${expectedAmount}`}
          icon={<ShoppingBag size={20} />}
          tone="green"
        />
        <StatCard
          label="Pending"
          value={pendingOrders}
          icon={<CalendarDays size={20} />}
          tone="amber"
        />
      </div>

      <Panel
        title="Create Order"
        subtitle="Log the customer, product, price, quantity, and delivery date."
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

          <Field label="Expected Unit Price">
            <input
              type="number"
              value={expectedUnitPrice}
              onChange={(event) => setExpectedUnitPrice(event.target.value)}
            />
          </Field>

          <Field label="Delivery Date">
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(event) => setExpectedDeliveryDate(event.target.value)}
            />
          </Field>

          <Field label="Remarks">
            <input
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </Field>

          <button className="admin-button" type="button" onClick={createOrder}>
            <Save size={17} />
            Create Order
          </button>
        </div>
      </Panel>

      <Panel
        title="Order Pipeline"
        subtitle="Expected delivery and value are grouped per customer order."
      >
        {orders.length === 0 && (
          <EmptyState
            title="No customer orders yet"
            message="Create an order above to begin tracking fulfilment."
          />
        )}

        {orders.length > 0 && (
          <div className="admin-record-grid">
            {(orders || []).map((order) => (
              <article className="admin-record-card" key={order.id}>
                <header>
                  <div>
                    <h3>{order.orderCode}</h3>
                    <small>{order.customerName}</small>
                  </div>
                  <StatusPill status={order.status} />
                </header>

                <div className="admin-record-details">
                  <div>
                    <span>Product</span>
                    <strong>{order.productName}</strong>
                  </div>
                  <div>
                    <span>Quantity</span>
                    <strong>{order.quantity}</strong>
                  </div>
                  <div>
                    <span>Unit Price</span>
                    <strong>Rs. {order.expectedUnitPrice}</strong>
                  </div>
                  <div>
                    <span>Amount</span>
                    <strong>Rs. {order.expectedAmount}</strong>
                  </div>
                  <div>
                    <span>Delivery Date</span>
                    <strong>{order.expectedDeliveryDate || "Not set"}</strong>
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

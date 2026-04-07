import { useState } from "react";

export default function OrderForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    quantity: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const message = `New Order:%0AName: ${form.name}%0APhone: ${form.phone}%0AQuantity: ${form.quantity}`;

    window.open(`https://wa.me/919738451955?text=${message}`);
  };

  return (
    <section className="section container">
      <div className="card">
        <h2>Place Your Order</h2>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <input
            placeholder="Your Name"
            required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Phone Number"
            required
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <input
            placeholder="Quantity (kg)"
            required
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />

          <button className="btn" style={{ marginTop: "15px" }}>
            Submit Order
          </button>
        </form>
      </div>
    </section>
  );
}
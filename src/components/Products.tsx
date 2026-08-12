import { useState, type ReactElement, type SyntheticEvent } from "react";

interface Product {
  id: number;
  name: string;
  desc: string;
  price: number;
  unit: string;
  img: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "Button Mushrooms ",
    desc: "Fresh, firm, ideal for everyday cooking.  (Subject to availability)",
    price: 199,
    unit: "kg",
    img: "/button-mushroom.jpg",
  },
  {
    id: 2,
    name: "Oyster Mushrooms",
    desc: "Soft texture, rich flavor, highly nutritious",
    price: 199,
    unit: "kg",
    img: "/oyster-mushroom.jpg",
  },
  {
    id: 3,
    name: "Oyster Mushroom Box (200gm)",
    desc: "Fresh packed mushrooms ready for daily use",
    price: 59,
    unit: "box",
    img: "/oyster-mushroom-box.jpg",
  },
];

export default function Products(): ReactElement {
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const increaseQty = (id: number): void => {
    setQuantities((prev) => ({
      ...prev,
      [id]: (prev[id] || 1) + 1,
    }));
  };

  const decreaseQty = (id: number): void => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) - 1),
    }));
  };

  const orderOnWhatsApp = (product: Product): void => {
    const qty = quantities[product.id] || 1;
    const total = qty * product.price;

    const message = `
Hi Samaksh Farms,

I would like to place an order.

Product: ${product.name}
Quantity: ${qty} ${product.unit}
Estimated Amount: Rs. ${total}

Please share payment details.

Thank you.
`;

    const encodedMessage = encodeURIComponent(message);

    window.open(
      `https://api.whatsapp.com/send?phone=919738451955&text=${encodedMessage}`,
      "_blank",
    );
  };

  return (
    <section
      id="products"
      className="section container"
      style={{
        paddingTop: "10px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        <h2>Choose Your Fresh Mushrooms</h2>

        <p
          style={{
            opacity: 0.7,
            maxWidth: "600px",
            margin: "10px auto",
          }}
        >
          Freshly harvested and delivered across Bengaluru and Chikkaballapur.
        </p>
      </div>

      <div className="products-grid">
        {products.map((product) => {
          const qty = quantities[product.id] || 1;

          return (
            <div key={product.id} className="card product-card">
              <img
                src={product.img}
                alt={product.name}
                className="product-img"
                onError={(event: SyntheticEvent<HTMLImageElement>) => {
                  event.currentTarget.src = "/fallback.jpg";
                }}
              />

              <div className="product-content">
                <h3>{product.name}</h3>

                <p className="product-desc">{product.desc}</p>

                <div className="product-price">
                  Rs. {product.price}
                  {product.unit === "kg" ? "/kg" : ""}
                </div>

                <div className="qty-wrapper">
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => decreaseQty(product.id)}
                  >
                    -
                  </button>

                  <span className="qty-value">{qty}</span>

                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => increaseQty(product.id)}
                  >
                    +
                  </button>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    marginTop: "10px",
                    opacity: 0.8,
                    fontWeight: 600,
                  }}
                >
                  Total: Rs. {qty * product.price}
                </div>

                <button
                  className="btn whatsapp-order-btn"
                  type="button"
                  onClick={() => orderOnWhatsApp(product)}
                >
                  Order on WhatsApp
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

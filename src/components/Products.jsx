const products = [
  {
    name: "Button Mushrooms",
    desc: "Fresh, firm, ideal for everyday cooking",
    price: "₹200/kg",
    img: "/button.jpg"
  },
  {
    name: "Oyster Mushrooms",
    desc: "Soft texture, rich flavor, highly nutritious",
    price: "₹250/kg",
    img: "/oyster.jpg"
  }
];

export default function Products() {
  return (
    <section
        className="section container"
        style={{
            paddingTop: "20px",   // 👈 VERY IMPORTANT
            marginTop: "0px"
        }}
    >

      {/* 🔥 BETTER HEADING */}
      <h2>Available Fresh Mushrooms</h2>

      <p style={{
        marginTop: "8px",
        opacity: 0.7,
        maxWidth: "500px"
      }}>
        Choose from our freshly harvested mushrooms grown at Samaksh Farms.
      </p>

      <div className="grid grid-2" style={{ marginTop: "35px" }}>
        {products.map((p, i) => (
          <div key={i} className="card">

            {/* 🖼 IMAGE WITH FALLBACK */}
            <img
              src={p.img}
              alt={p.name}
              className="product-img"
              onError={(e) => {
                e.target.src = "/fallback.jpg";
              }}
            />

            <h3 style={{ marginTop: "12px" }}>{p.name}</h3>

            <p style={{ opacity: 0.6 }}>{p.desc}</p>

            <div style={{
              marginTop: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <b>{p.price}</b>
              <button className="btn">Order</button>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
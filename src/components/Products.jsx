export default function Hero() {
  return (
    <section
      className="section container fade-in"
      style={{
        backgroundImage: "url('/hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "120px 20px",
        textAlign: "center"
      }}
    >
      <div className="container">
        <h1 style={{ fontSize: "48px" }}>
          Fresh Mushrooms in Bangalore
        </h1>

        <p style={{ marginTop: "10px", opacity: 0.7 }}>
          From Samaksh Farms 🌱 Delivered fresh within 24 hours
        </p>

        <a className="btn" style={{ marginTop: "15px" }}>
          Order Now
        </a>
      </div>
    </section>
  );
}
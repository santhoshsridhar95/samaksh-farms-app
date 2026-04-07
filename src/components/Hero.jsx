export default function Hero() {
  return (
    <section
      className="section fade-in"
      style={{
        backgroundImage: "url('/hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "120px 20px",
        textAlign: "center"
      }}
    >
      <div className="container">
        <h1 style={{
            fontSize: "48px",
            fontWeight: "700",
            letterSpacing: "-1px"
            }}>
            Fresh Mushrooms in <span style={{ color: "var(--primary)" }}>Bangalore</span>
        </h1>
        <p style={{
            maxWidth: "500px",
            margin: "auto",
            marginTop: "15px",
            lineHeight: "1.6"
            }}>
            Naturally grown, chemical-free mushrooms delivered fresh from Samaksh Farms.
        </p>
        
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
export default function Hero() {
  return (
    <section
      className="container"
      style={{
        paddingTop: "35px",   // 👈 KEY FIX (reduce top gap)
        paddingBottom: "20px"
      }}
    >
      <div style={{ textAlign: "center" }}>

        {/* HEADLINE */}
        <h1
          style={{
            fontSize: "44px",
            fontWeight: "700",
            lineHeight: "1.2",
            marginTop: "10px" // 👈 prevents extra browser gap
          }}
        >
          Fresh Mushrooms in Bangalore <br />
          Delivered Within 24 Hours
        </h1>

        {/* SUBTEXT */}
        <p
          style={{
            maxWidth: "600px",
            margin: "auto",
            marginTop: "10px",
            fontSize: "15px",
            opacity: 0.75
          }}
        >
          Grown in clean, controlled conditions at Samaksh Farms and delivered fresh 
          to your home across Bangalore.
        </p>

        {/* TRUST */}
        <div
          style={{
            marginTop: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            opacity: 0.8,
            fontSize: "14px"
          }}
        >
          <span>✔️ Chemical-free cultivation</span>
          <span>✔️ Hygienic farm environment</span>
          <span>✔️ Fast delivery across Bangalore</span>
        </div>

        {/* CTA */}
        <div style={{ marginTop: "16px" }}>
          <button className="btn">
            Order Fresh Mushrooms
          </button>
        </div>

      </div>
    </section>
  );
}
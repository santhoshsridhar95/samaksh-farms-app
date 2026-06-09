export default function About() {
  return (
    <section className="section container about-section">
      <div className="about-grid">
        {/* LEFT SIDE */}

        <div className="about-left">
          <span className="about-label">ABOUT SAMAKSH FARMS</span>

          <h2 className="about-title">
            Fresh mushrooms grown at our farm in Chikkaballapur and delivered
            directly to homes across Bengaluru and Chikkaballapur.
          </h2>

          <p className="about-text">
            Samaksh Farms is a passionate agri-venture founded by a team of
            friends committed to growing fresh, nutritious, and high-quality
            mushrooms using modern cultivation practices.
          </p>

          <p className="about-text">
            We believe customers deserve to know where their food comes from.
            That's why every mushroom we sell is grown, harvested, packed and
            delivered by us — ensuring freshness, quality and consistency in
            every order.
          </p>

          <div className="about-tags">
            <span>Fresh Daily</span>
            <span>Farm Grown</span>
            <span>No Middlemen</span>
            <span>Fast Delivery</span>
          </div>
        </div>

        {/* RIGHT SIDE */}

        <div className="about-right">
          <div className="trust-card card-1">
            <h3>24 Hrs</h3>
            <p>Fresh Delivery</p>
          </div>

          <div className="trust-card card-2">
            <h3>Farm</h3>
            <p>Chikkaballapur</p>
          </div>

          <div className="trust-card card-3">
            <h3>Fresh</h3>
            <p>Regular Harvests</p>
          </div>

          <div className="trust-card card-4">
            <h3>Direct</h3>
            <p>No Middlemen</p>
          </div>
        </div>
      </div>

      {/* BRAND STATEMENT */}

      <div className="about-brand">
        <span className="brand-line"></span>

        <div className="brand-message">
          <h3>Real Farm.</h3>
          <h3>Real Freshness.</h3>
          <h3>No Middlemen.</h3>
        </div>

        <span className="brand-line"></span>
      </div>
    </section>
  );
}

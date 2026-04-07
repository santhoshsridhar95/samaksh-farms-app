export default function Navbar({ toggleTheme }) {
  return (
    <nav style={{ padding: "15px 20px" }}>
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>🍄 Samaksh Farms</h3>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={toggleTheme} className="btn">
            🌗
          </button>

          <a className="btn" href="#">
            Order
          </a>
        </div>
      </div>
    </nav>
  );
}
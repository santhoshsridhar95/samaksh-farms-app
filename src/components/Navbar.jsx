import { useEffect, useState } from "react";

export default function Navbar({ toggleTheme }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  const handleToggle = () => {
    toggleTheme();
    setDark(!dark);
  };

  return (
    <nav className="navbar">
      <div className="container nav-content">

        {/* 🔥 PREMIUM BRAND LOGO */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontWeight: "700",
              fontSize: "20px",
              letterSpacing: "0.5px"
            }}
          >
            Samaksh <span style={{ color: "var(--primary)" }}>Farms</span>
          </span>

          <span
            style={{
              fontSize: "11px",
              opacity: 0.6,
              letterSpacing: "1px"
            }}
          >
            FRESH • ORGANIC • NATURAL • LOCAL
          </span>
        </div>

        {/* RIGHT SIDE */}
        <div className="nav-actions">

          {/* THEME TOGGLE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer"
            }}
            onClick={handleToggle}
          >
            <div className="theme-toggle">
              <div className={`toggle-circle ${dark ? "dark" : ""}`}>
                {dark ? "🌙" : "☀️"}
              </div>
            </div>

            <span style={{ fontSize: "12px", opacity: 0.7 }}>
              {dark ? "Dark" : "Light"}
            </span>
          </div>

          <button className="btn">Order</button>
        </div>
      </div>
    </nav>
  );
}
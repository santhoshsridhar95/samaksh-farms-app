import { useEffect, useState, type ReactElement } from "react";

import { useNavigate } from "react-router-dom";

interface NavbarProps {
  toggleTheme: () => void;
}

export default function Navbar({ toggleTheme }: NavbarProps): ReactElement {
  const navigate = useNavigate();

  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");

    setDark(isDark);
  }, []);

  const handleToggle = (): void => {
    toggleTheme();

    setDark(!dark);
  };

  return (
    <>
      <div
        style={{
          height: "32px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "0 40px",
          background: "#fafafa",
          borderBottom: "1px solid #eeeeee",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
            color: "#666",
            fontWeight: 500,
          }}
        >
          Admin Portal
        </button>
      </div>

      <nav className="navbar">
        <div className="container nav-content">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontWeight: "700",
                fontSize: "20px",
                letterSpacing: "0.5px",
              }}
            >
              Samaksh{" "}
              <span
                style={{
                  color: "var(--primary)",
                }}
              >
                Farms
              </span>
            </span>

            <span
              style={{
                fontSize: "11px",
                opacity: 0.6,
                letterSpacing: "1px",
              }}
            >
              FRESH | LOCAL | FARM GROWN
            </span>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                background: "transparent",
                border: 0,
                color: "inherit",
                padding: 0,
              }}
              onClick={handleToggle}
            >
              <div className="theme-toggle">
                <div className={`toggle-circle ${dark ? "dark" : ""}`}>
                  {dark ? "D" : "L"}
                </div>
              </div>

              <span
                style={{
                  fontSize: "12px",
                  opacity: 0.7,
                }}
              >
                {dark ? "Dark" : "Light"}
              </span>
            </button>

            <button className="btn" type="button">
              Order
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

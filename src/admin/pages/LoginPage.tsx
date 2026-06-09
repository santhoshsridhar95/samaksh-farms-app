import { useState } from "react";
import api from "../services/api";

import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

import "./LoginPage.css";
import logo from "../../../public/Samaksh_Mushroom_Icon.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const validate = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter valid email");
      return false;
    }

    if (!password.trim()) {
      setError("Password is required");
      return false;
    }

    setError("");
    return true;
  };

  const login = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      const data = response.data;

      localStorage.setItem("token", data.token);

      localStorage.setItem("role", data.role);

      localStorage.setItem("userName", data.name);

      localStorage.setItem("userId", String(data.userId));

      window.location.href = "/admin/dashboard";
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logo} alt="Samaksh" className="logo" />

        <h1>Samaksh Farms ERP</h1>

        <p>Production • Inventory • Sales</p>

        <div className="field">
          <Mail size={18} />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <Lock size={18} />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                login();
              }
            }}
          />

          {showPassword ? (
            <EyeOff
              size={18}
              onClick={() => setShowPassword(false)}
              className="eye"
            />
          ) : (
            <Eye
              size={18}
              onClick={() => setShowPassword(true)}
              className="eye"
            />
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <button className="login-btn" disabled={loading} onClick={login}>
          {loading ? (
            <>
              <Loader2 size={18} className="spin" />
              Signing In...
            </>
          ) : (
            "Login"
          )}
        </button>

        <div className="footer">© Samaksh Farms ERP</div>
      </div>
    </div>
  );
}

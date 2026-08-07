import { useState } from "react";
import api from "../services/api";

import { Eye, EyeOff, Loader2, Lock, Mail, Phone, User } from "lucide-react";

import "./LoginPage.css";
import logo from "../../../public/Samaksh_Mushroom_Icon.png";

type LoginMode = "login" | "signup" | "forgot";

export default function LoginPage({
  initialMode = "login",
}: {
  initialMode?: LoginMode;
}) {
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");

  const validate = () => {
    if (mode === "signup" && !name.trim()) {
      showMessage("Name is required", "error");
      return false;
    }

    if (!loginId.trim()) {
      showMessage(mode === "login" ? "Email or phone is required" : "Email is required", "error");
      return false;
    }

    if (mode === "signup" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginId)) {
      showMessage("Enter a valid email", "error");
      return false;
    }

    if (mode === "signup" && !phoneNumber.trim()) {
      showMessage("Phone number is required", "error");
      return false;
    }

    if (mode === "signup" && !/^[0-9]{10}$/.test(phoneNumber.trim())) {
      showMessage("Phone number must be exactly 10 digits", "error");
      return false;
    }

    if (mode !== "forgot" && password.trim().length < 8) {
      showMessage("Password must be at least 8 characters", "error");
      return false;
    }

    showMessage("", "error");
    return true;
  };

  const submit = async () => {
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        await api.post("/api/auth/signup", {
          name,
          email: loginId,
          phoneNumber,
          password,
        });

        setMode("login");
        setName("");
        setPhoneNumber("");
        setPassword("");
        showMessage("Signup sent for super admin approval.", "success");
        return;
      }

      if (mode === "forgot") {
        await api.post("/api/auth/forgot-password", {
          login: loginId,
        });

        setMode("login");
        showMessage("Password reset request sent to super admin.", "success");
        return;
      }

      const response = await api.post("/api/auth/login", {
        email: loginId,
        password,
      });

      const data = response.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userId", String(data.userId));

      window.location.href = "/admin/dashboard";
    } catch (error: any) {
      showMessage(error?.response?.data?.message || "Unable to complete request", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (value: string, tone: "error" | "success") => {
    setMessage(value);
    setMessageTone(tone);
  };

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setMessage("");
    setPassword("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logo} alt="Samaksh" className="logo" />

        <h1>Samaksh Farms ERP</h1>

        <p>Production, Inventory, Sales</p>

        <div className="login-mode-switch">
          <button
            type="button"
            className={mode === "login" ? "is-active" : ""}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "is-active" : ""}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
          <button
            type="button"
            className={mode === "forgot" ? "is-active" : ""}
            onClick={() => switchMode("forgot")}
          >
            Forgot
          </button>
        </div>

        {mode === "signup" && (
          <div className="field">
            <User size={18} />
            <input
              placeholder="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        )}

        <div className="field">
          <Mail size={18} />
          <input
            type={mode === "signup" ? "email" : "text"}
            placeholder={mode === "signup" ? "Email address" : "Email or phone"}
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
          />
        </div>

        {mode === "signup" && (
          <div className="field">
            <Phone size={18} />
            <input
              inputMode="numeric"
              maxLength={10}
              placeholder="Phone number"
              value={phoneNumber}
              onChange={(event) =>
                setPhoneNumber(
                  event.target.value.replace(/\D/g, "").slice(0, 10),
                )
              }
            />
          </div>
        )}

        {mode !== "forgot" && (
          <div className="field">
            <Lock size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submit();
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
        )}

        {message && <div className={`login-message login-message-${messageTone}`}>{message}</div>}

        <button className="login-btn" disabled={loading} onClick={submit}>
          {loading ? (
            <>
              <Loader2 size={18} className="spin" />
              Working...
            </>
          ) : mode === "signup" ? (
            "Submit Sign Up"
          ) : mode === "forgot" ? (
            "Request Reset"
          ) : (
            "Login"
          )}
        </button>

        <div className="footer">(c) Samaksh Farms ERP</div>
      </div>
    </div>
  );
}

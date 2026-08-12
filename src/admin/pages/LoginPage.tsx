import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { markSessionStarted } from "../../routes/authSession";
import { GOOGLE_CLIENT_ID } from "../../config/api";
import { pingServerOnLoginPage } from "../utils/serverKeepAlive";

import { Eye, EyeOff, Loader2, Lock, Mail, Phone, User } from "lucide-react";

import "./LoginPage.css";
import logo from "../../../public/Samaksh_Mushroom_Icon.png";

type LoginMode = "login" | "signup" | "forgot" | "verify";
type FieldErrors = Partial<Record<"name" | "loginId" | "phoneNumber" | "password" | "otp", string>>;

declare global {
  interface Window {
    google?: any;
  }
}

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
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    pingServerOnLoginPage();
    loadAuthConfig();
  }, []);

  useEffect(() => {
    if (!emailVerificationEnabled && mode === "verify") {
      switchMode("login");
    }
  }, [emailVerificationEnabled, mode]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || mode === "forgot" || mode === "verify") {
      return;
    }

    loadGoogleScript().then(() => {
      if (!window.google || !googleButtonRef.current) {
        return;
      }

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => submitGoogle(response.credential),
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 340,
        text: mode === "signup" ? "signup_with" : "signin_with",
      });
    });
  }, [mode]);

  const validate = () => {
    const nextErrors: FieldErrors = {};

    if (mode === "signup" && !name.trim()) {
      nextErrors.name = "Name is required";
    }

    if (!loginId.trim()) {
      nextErrors.loginId =
        mode === "login" || mode === "forgot"
          ? "Email or phone is required"
          : "Email is required";
    }

    if (mode === "signup" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginId)) {
      nextErrors.loginId = "Enter a valid email";
    }

    if (mode === "verify" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginId)) {
      nextErrors.loginId = "Enter the email address used for signup";
    }

    if (mode === "signup" && !phoneNumber.trim()) {
      nextErrors.phoneNumber = "Phone number is required";
    }

    if (mode === "signup" && !/^[0-9]{10}$/.test(phoneNumber.trim())) {
      nextErrors.phoneNumber = "Phone number must be exactly 10 digits";
    }

    if (mode === "login" && !password.trim()) {
      nextErrors.password = "Password is required";
    }

    if (mode === "signup" && password.trim().length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    if (mode === "verify" && !otp.trim()) {
      nextErrors.otp = "Verification OTP is required";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage("");
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
        const response = await api.post("/api/auth/signup", {
          name,
          email: loginId,
          phoneNumber,
          password,
        });

        setMode(emailVerificationEnabled ? "verify" : "login");
        setName("");
        setPhoneNumber("");
        setPassword("");
        showMessage(
          response?.data?.message ||
            (emailVerificationEnabled
              ? "OTP sent. Verify your email before super admin approval."
              : "Signup submitted for super admin approval."),
          "success",
        );
        return;
      }

      if (mode === "verify") {
        const response = await api.post("/api/auth/verify-email", {
          email: loginId,
          otp,
        });

        setMode("login");
        setOtp("");
        showMessage(
          response?.data?.message ||
            "Email verified. Signup is now waiting for super admin approval.",
          "success",
        );
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

      handleLoginResponse(response.data);
    } catch (error: any) {
      const responseData = error?.response?.data;
      const backendErrors = responseData?.data;

      if (backendErrors && typeof backendErrors === "object") {
        setFieldErrors(mapBackendErrors(backendErrors));
        setMessage("");
        return;
      }

      const errorMessage = responseData?.message || "Unable to complete request";
      const fieldError = fieldErrorForMessage(errorMessage);

      if (fieldError) {
        setFieldErrors(fieldError);
        setMessage("");
        return;
      }

      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async (idToken: string) => {
    if (!idToken) {
      showMessage("Google did not return a valid token", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/api/auth/google", {
        idToken,
        intent: mode === "signup" ? "SIGNUP" : "LOGIN",
      });

      handleLoginResponse(response.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Unable to complete Google authentication";

      if (message.toLowerCase().includes("submitted")) {
        showMessage(message, "success");
        setMode("login");
        return;
      }

      showMessage(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginResponse = (data: any) => {
    if (!data?.token || !data?.role) {
      showMessage("Login response is missing session details", "error");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("roles", JSON.stringify(data.roles || [data.role]));
    localStorage.setItem("userName", data.name);
    localStorage.setItem("userId", String(data.userId));
    markSessionStarted();

    window.location.href = "/admin/dashboard";
  };

  const showMessage = (value: string, tone: "error" | "success") => {
    setMessage(value);
    setMessageTone(tone);
  };

  const loadAuthConfig = async () => {
    try {
      const response = await api.get("/api/auth/config");
      setEmailVerificationEnabled(
        Boolean(response?.data?.data?.emailVerificationEnabled),
      );
    } catch {
      setEmailVerificationEnabled(false);
    }
  };

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setMessage("");
    setPassword("");
    setOtp("");
    setFieldErrors({});
  };

  const updateName = (value: string) => {
    setName(value);
    clearFieldError("name");
  };

  const updateLoginId = (value: string) => {
    setLoginId(value);
    clearFieldError("loginId");
  };

  const updatePhoneNumber = (value: string) => {
    setPhoneNumber(value);
    clearFieldError("phoneNumber");
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    clearFieldError("password");
  };

  const updateOtp = (value: string) => {
    setOtp(value.replace(/\D/g, "").slice(0, 6));
    clearFieldError("otp");
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
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
        </div>

        {GOOGLE_CLIENT_ID && mode !== "forgot" && mode !== "verify" && (
          <div className="google-login-wrap" ref={googleButtonRef} />
        )}

        {mode === "signup" && (
          <div className="login-field-group">
            <div className={`field ${fieldErrors.name ? "field-invalid" : ""}`}>
              <User size={18} />
              <input
                aria-invalid={Boolean(fieldErrors.name)}
                placeholder="Full name"
                value={name}
                onChange={(event) => updateName(event.target.value)}
              />
            </div>
            {fieldErrors.name && (
              <span className="field-error">{fieldErrors.name}</span>
            )}
          </div>
        )}

        {emailVerificationEnabled && mode === "verify" && (
          <div className="login-field-group">
            <div className={`field ${fieldErrors.otp ? "field-invalid" : ""}`}>
              <Mail size={18} />
              <input
                aria-invalid={Boolean(fieldErrors.otp)}
                inputMode="numeric"
                maxLength={6}
                placeholder="Email OTP"
                value={otp}
                onChange={(event) => updateOtp(event.target.value)}
              />
            </div>
            {fieldErrors.otp && (
              <span className="field-error">{fieldErrors.otp}</span>
            )}
          </div>
        )}

        <div className="login-field-group">
          <div className={`field ${fieldErrors.loginId ? "field-invalid" : ""}`}>
            <Mail size={18} />
            <input
              aria-invalid={Boolean(fieldErrors.loginId)}
              type={mode === "signup" ? "email" : "text"}
              placeholder={
                mode === "signup" || mode === "verify"
                  ? "Email address"
                  : "Login via email ID or mobile number"
              }
              value={loginId}
              onChange={(event) => updateLoginId(event.target.value)}
            />
          </div>
          {fieldErrors.loginId && (
            <span className="field-error">{fieldErrors.loginId}</span>
          )}
        </div>

        {mode === "signup" && (
          <div className="login-field-group">
            <div className={`field ${fieldErrors.phoneNumber ? "field-invalid" : ""}`}>
              <Phone size={18} />
              <input
                aria-invalid={Boolean(fieldErrors.phoneNumber)}
                inputMode="numeric"
                maxLength={10}
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(event) =>
                  updatePhoneNumber(
                    event.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
              />
            </div>
            {fieldErrors.phoneNumber && (
              <span className="field-error">{fieldErrors.phoneNumber}</span>
            )}
          </div>
        )}

        {mode !== "forgot" && mode !== "verify" && (
          <>
            <div className="login-field-group">
              <div className={`field ${fieldErrors.password ? "field-invalid" : ""}`}>
                <Lock size={18} />
                <input
                  aria-invalid={Boolean(fieldErrors.password)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(event) => updatePassword(event.target.value)}
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
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </div>

            {mode === "login" && (
              <button
                className="login-link-button"
                type="button"
                onClick={() => switchMode("forgot")}
              >
                Forgot password?
              </button>
            )}
          </>
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
          ) : mode === "verify" ? (
            "Verify Email"
          ) : (
            "Login"
          )}
        </button>

        <div className="footer">(c) Samaksh Farms ERP</div>
      </div>
    </div>
  );
}

function mapBackendErrors(errors: Record<string, string>) {
  const nextErrors: FieldErrors = {};

  if (errors.name) {
    nextErrors.name = errors.name;
  }

  if (errors.email || errors.login) {
    nextErrors.loginId = errors.email || errors.login;
  }

  if (errors.phoneNumber) {
    nextErrors.phoneNumber = errors.phoneNumber;
  }

  if (errors.password) {
    nextErrors.password = errors.password;
  }

  if (errors.otp || errors.token) {
    nextErrors.otp = errors.otp || errors.token;
  }

  return nextErrors;
}

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      "script[src='https://accounts.google.com/gsi/client']",
    );

    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

function fieldErrorForMessage(message: string): FieldErrors | null {
  const normalized = message.toLowerCase();

  if (normalized.includes("email")) {
    return { loginId: message };
  }

  if (normalized.includes("phone")) {
    return { phoneNumber: message };
  }

  if (normalized.includes("password")) {
    return { password: message };
  }

  return null;
}

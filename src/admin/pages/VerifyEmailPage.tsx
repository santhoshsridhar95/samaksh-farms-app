import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";

import api from "../services/api";
import "./LoginPage.css";
import logo from "../../../public/Samaksh_Mushroom_Icon.png";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying your email...");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification link is missing a token.");
      return;
    }

    try {
      const response = await api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
      setStatus("success");
      setMessage(
        response?.data?.message ||
          "Email verified. Signup is now waiting for super admin approval.",
      );
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.response?.data?.message || "Email verification failed.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logo} alt="Samaksh" className="logo" />
        <h1>Email Verification</h1>
        <p>Samaksh Farms ERP</p>

        <div className={`login-message login-message-${status === "error" ? "error" : "success"}`}>
          {status === "loading" ? (
            <>
              <Loader2 size={18} className="spin" />
              {message}
            </>
          ) : (
            <>
              <MailCheck size={18} />
              {message}
            </>
          )}
        </div>

        <Link className="login-btn" to="/login">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

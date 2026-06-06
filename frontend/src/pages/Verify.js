import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import NovalaVerifyModal from "../components/NovalaVerifyModal";

const API = "https://api.getnovala.com/api/v1";

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("access_token");
}

export default function Verify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sendError, setSendError] = useState("");
  const sentRef = useRef(false);

  const email = localStorage.getItem("user_email") || localStorage.getItem("email") || "";
  const phone = localStorage.getItem("signup_phone") || "";

  const sendCode = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    setSendError("");
    try {
      const res = await fetch(API + "/auth/send-verification-code", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Could not send code." }));
        setSendError(err.detail || "Could not send code.");
      }
    } catch (e) {
      setSendError("Network error. Click Resend to try again.");
    }
  };

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCodeSubmit = async (code) => {
    const token = getToken();
    if (!token) return false;
    try {
      const res = await fetch(API + "/auth/verify-code", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ code: code })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  };

  const handleVerified = () => {
    const params = new URLSearchParams();
    params.set("fromCheckout", "true");
    const plan = searchParams.get("plan");
    const billing = searchParams.get("billing");
    const payroll = searchParams.get("payroll");
    if (plan) params.set("plan", plan);
    if (billing) params.set("billing", billing);
    if (payroll) params.set("payroll", payroll);
    navigate("/register?" + params.toString());
  };

  const handleResend = () => {
    sendCode();
  };

  const handleClose = () => {
    navigate("/checkout");
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "linear-gradient(135deg, #F9FAFA 0%, #E6F2F2 100%)",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      <div style={{
        position: "absolute",
        top: 24,
        left: 24,
        zIndex: 3500
      }}>
        <Link
          to="/checkout"
          style={{
            color: "#0F9599",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none"
          }}
        >
          {"\u2039 Back to account info"}
        </Link>
      </div>

      <NovalaVerifyModal
        phone={phone}
        email={email}
        defaultMethod="email"
        availableMethods={["email"]}
        onCodeSubmit={handleCodeSubmit}
        onVerified={handleVerified}
        onResend={handleResend}
        onClose={handleClose}
      />

      {sendError && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#FDECEB",
          color: "#D9453C",
          padding: "10px 18px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          zIndex: 3500,
          border: "1px solid #F5C2BD",
          maxWidth: "90%"
        }}>
          {sendError} Click Resend to try again.
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "https://api.getnovala.com";

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("jwt");
  return token ? { Authorization: "Bearer " + token } : {};
}

export default function CurrentSubscriptionCard() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch(API_BASE + "/api/v1/subscriptions/me", { headers: getAuthHeaders() })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        setSub(data);
        setLoading(false);
      })
      .catch(function (err) {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  async function handleCancel() {
    if (!window.confirm("Cancel your Novala subscription? You'll keep access until the end of the current billing period.")) return;
    setCancelling(true);
    try {
      const res = await fetch(API_BASE + "/api/v1/subscriptions/cancel", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error("Cancel failed: " + res.status + " - " + txt);
      }
      const updated = await res.json();
      setSub(updated);
    } catch (err) {
      alert("Cancellation failed: " + err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 16, color: "#5B6B6B", fontSize: 13 }}>Loading subscription...</div>;
  }
  if (error) {
    return <div style={{ padding: 16, color: "#D9453C", fontSize: 13 }}>Error: {error}</div>;
  }

  const wrapperStyle = {
    padding: 20,
    border: "1.6px solid #DDE5E5",
    borderRadius: 13,
    background: "#fff",
    maxWidth: 480,
  };

  if (!sub) {
    return (
      <div style={wrapperStyle}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1A1A" }}>No active subscription</div>
        <div style={{ marginTop: 6, fontSize: 13, color: "#5B6B6B" }}>You are on the Free plan.</div>
      </div>
    );
  }

  const isActive =
    sub.status === "ACTIVE" ||
    sub.status === "APPROVAL_PENDING" ||
    sub.status === "APPROVED";
  const statusColor = isActive ? "#10A35A" : "#D9453C";

  return (
    <div style={wrapperStyle}>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1A1A", marginBottom: 14 }}>
        Current Subscription
      </div>
      <div style={{ fontSize: 13, color: "#5B6B6B", display: "grid", gap: 8 }}>
        <div><strong style={{ color: "#0E1A1A" }}>Plan:</strong> {sub.plan_slug}</div>
        <div><strong style={{ color: "#0E1A1A" }}>Status:</strong> <span style={{ color: statusColor, fontWeight: 600 }}>{sub.status}</span></div>
        {sub.current_period_end && (
          <div><strong style={{ color: "#0E1A1A" }}>{isActive ? "Renews on" : "Period ends"}:</strong> {new Date(sub.current_period_end).toLocaleDateString()}</div>
        )}
        {sub.last_payment_at && (
          <div><strong style={{ color: "#0E1A1A" }}>Last payment:</strong> {new Date(sub.last_payment_at).toLocaleDateString()}</div>
        )}
        {sub.cancelled_at && (
          <div><strong style={{ color: "#0E1A1A" }}>Cancelled:</strong> {new Date(sub.cancelled_at).toLocaleDateString()}</div>
        )}
      </div>
      {isActive && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelling}
          style={{
            marginTop: 18,
            background: "#fff",
            border: "1.6px solid #D9453C",
            color: "#D9453C",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: cancelling ? "wait" : "pointer",
            opacity: cancelling ? 0.6 : 1,
          }}
        >
          {cancelling ? "Cancelling..." : "Cancel subscription"}
        </button>
      )}
    </div>
  );
}

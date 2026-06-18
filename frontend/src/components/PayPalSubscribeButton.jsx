import React, { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons, FUNDING } from "@paypal/react-paypal-js";

const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;
const API_BASE = process.env.REACT_APP_API_BASE || "https://api.getnovala.com";

export default function PayPalSubscribeButton({ planSlug, fundingSource = "paypal", onSuccess, onError }) {
  const effectivePlanSlug =
    planSlug ||
    localStorage.getItem("selected_plan_slug") ||
    "essentials";

  const [planId, setPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API_BASE + "/api/v1/subscriptions/plans")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (cancelled) return;
        const match = (data.plans || []).find(function (p) { return p.slug === effectivePlanSlug; });
        if (!match) {
          setLoadError("Plan '" + effectivePlanSlug + "' not found");
        } else {
          setPlanId(match.plan_id);
        }
        setLoading(false);
      })
      .catch(function (err) {
        if (cancelled) return;
        setLoadError("Could not load plans: " + err.message);
        setLoading(false);
      });
    return function () { cancelled = true; };
  }, [effectivePlanSlug]);

  if (!PAYPAL_CLIENT_ID) {
    return <div style={{ padding: 16, color: "#D9453C", fontSize: 13 }}>PayPal is not configured.</div>;
  }
  if (loading) return <div style={{ padding: 16, color: "#5B6B6B", fontSize: 13 }}>Loading...</div>;
  if (loadError) return <div style={{ padding: 16, color: "#D9453C", fontSize: 13 }}>{loadError}</div>;
  if (!planId) return <div style={{ padding: 16, color: "#D9453C", fontSize: 13 }}>No matching plan.</div>;

  const fundingValue = FUNDING[String(fundingSource).toUpperCase()] || FUNDING.PAYPAL;

  return (
    <div style={{ minWidth: 240, maxWidth: 320, margin: "0 auto" }}>
      <PayPalScriptProvider
        options={{
          clientId: PAYPAL_CLIENT_ID,
          vault: true,
          intent: "subscription",
        }}
      >
        <PayPalButtons
          fundingSource={fundingValue}
          style={{
            layout: "vertical",
            color: fundingSource === "card" ? "black" : "gold",
            shape: "rect",
            label: "subscribe",
          }}
          createSubscription={function (data, actions) {
            return actions.subscription.create({ plan_id: planId });
          }}
          onApprove={async function (data) {
            try {
              const token =
                localStorage.getItem("access_token") ||
                localStorage.getItem("token") ||
                localStorage.getItem("jwt");
              const res = await fetch(API_BASE + "/api/v1/subscriptions/activate", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: token ? "Bearer " + token : "",
                },
                body: JSON.stringify({
                  subscription_id: data.subscriptionID,
                  plan_slug: effectivePlanSlug,
                }),
              });
              if (!res.ok) {
                const txt = await res.text();
                throw new Error("Backend activate failed: " + res.status + " - " + txt);
              }
              const sub = await res.json();
              if (onSuccess) onSuccess(sub);
              else window.location.href = "/dashboard?subscribed=" + effectivePlanSlug;
            } catch (err) {
              console.error("[PayPalSubscribeButton] onApprove failed:", err);
              if (onError) onError(err);
              else alert("Subscription failed: " + err.message);
            }
          }}
          onError={function (err) {
            console.error("[PayPalSubscribeButton] PayPal SDK error:", err);
            if (onError) onError(err);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}

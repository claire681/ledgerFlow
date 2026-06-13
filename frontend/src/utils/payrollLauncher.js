import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const formatError = (err) => {
  if (!err) return "Unknown error";
  if (Array.isArray(err.detail)) {
    return err.detail.map((d) => {
      if (typeof d === "string") return d;
      const loc = (d.loc || []).filter((l) => l !== "body").join(".");
      return (d.msg || "validation error") + (loc ? " (" + loc + ")" : "");
    }).join("; ");
  }
  if (typeof err.detail === "string") return err.detail;
  if (typeof err === "string") return err;
  return JSON.stringify(err);
};

const computeDefaults = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const pay = new Date(end);
  const fmt = (d) =>
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
  return {
    pay_period_start: fmt(start),
    pay_period_end: fmt(end),
    pay_date: fmt(pay),
    country: "CA",
    currency: "CAD",
  };
};

export async function startNewPayroll(navigate) {
  try {
    const body = computeDefaults();
    const res = await fetch(API_URL + "/api/v1/payroll/runs", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + getToken(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(formatError(errJson));
    }
    const run = await res.json();
    if (!run.id) throw new Error("Pay run created without an id.");
    navigate("/payroll/run/" + run.id, { replace: true });
  } catch (e) {
    console.error("Pay run creation failed:", e);
    alert("Could not start payroll: " + e.message);
    navigate("/payroll/overview", { replace: true });
  }
}

export default function PayrollLauncher() {
  const navigate = useNavigate();
  useEffect(() => {
    startNewPayroll(navigate);
  }, [navigate]);
  return (
    <div style={{ padding: 60, textAlign: "center", fontFamily: "inherit", color: "#6B7280", fontSize: 13 }}>
      Starting your payroll run...
    </div>
  );
}

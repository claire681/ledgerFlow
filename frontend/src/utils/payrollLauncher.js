import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

// POST a new draft pay run, then navigate to the new Run Payroll screen.
export async function startNewPayroll(navigate) {
  try {
    const res = await fetch(API_URL + "/api/v1/payroll/runs", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + getToken(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Could not start a new pay run.");
    }
    const run = await res.json();
    if (!run.id) throw new Error("Pay run created without an id.");
    navigate("/payroll/run/" + run.id, { replace: true });
  } catch (e) {
    console.error(e);
    alert("Could not start payroll: " + e.message);
    navigate("/payroll/overview", { replace: true });
  }
}

// Route handler. Renders briefly while the draft is being created, then redirects.
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

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import EmployeesDirectory from "../components/EmployeesDirectory";
import { getReadiness } from "../utils/payrollReadiness";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const BRAND = "#0F9599";
const BRAND_DARK = "#0F6E56";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const BG_PAGE = "#F7F9F9";
const BORDER = "#E5E7EB";

export default function EmployeesDirectoryPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    fetch(API_URL + "/api/v1/payroll/employees", { headers: token ? { Authorization: "Bearer " + token } : {} })
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.employees || data.results || []);
        setEmployees(list);
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const withReadiness = useMemo(() => employees.map((e) => ({ ...e, readiness: getReadiness ? getReadiness(e) : null })), [employees]);

  return (
    <div style={{ background: BG_PAGE, minHeight: "100vh", padding: "30px 40px 80px", fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 27, fontWeight: 600, color: "#12262B", letterSpacing: "-0.02em", marginBottom: 5 }}>Employees</h1>
      <div style={{ fontSize: 14, color: TEXT_SECONDARY, marginBottom: 24 }}>
        Manage your team's profiles, pay, tax info, credentials, and direct deposit.
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid " + BORDER, marginBottom: 18 }}>
        <div onClick={() => navigate("/payroll/employees")} style={{ padding: "9px 14px", fontSize: 14, fontWeight: 600, color: TEXT_SECONDARY, cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: -1 }}>
          List
        </div>
        <div style={{ padding: "9px 14px", fontSize: 14, fontWeight: 600, color: BRAND_DARK, cursor: "default", borderBottom: "2px solid " + BRAND, marginBottom: -1 }}>
          Directory
        </div>
      </div>

      {loading && <div style={{ padding: 40, textAlign: "center", color: TEXT_SECONDARY }}>Loading employees...</div>}
      {error && <div style={{ padding: 16, background: "#FEE2E2", border: "1px solid #F87171", borderRadius: 10, color: "#991B1B", fontSize: 13 }}>Could not load: {error}</div>}
      {!loading && !error && <EmployeesDirectory employees={withReadiness} />}
    </div>
  );
}

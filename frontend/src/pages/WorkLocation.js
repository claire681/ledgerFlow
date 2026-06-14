import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, X, Search, MessageSquareText, ArrowUp } from "lucide-react";
import { LOCATIONS } from "../data/payrollItemsData";
import AssignEmployeesPanel from "../components/AssignEmployeesPanel";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const BRAND = "#0F9599";
const BRAND_DARK = "#0F6E56";
const TEXT_PRIMARY = "#111827";
const TEXT_INK = "#1A2B2B";
const TEXT_SECONDARY = "#6B7280";
const TEXT_TERTIARY = "#9CA3AF";
const BG_CARD = "#FFFFFF";
const BG_PAGE = "#F7F9F9";
const BORDER = "#E5E7EB";
const BORDER_LIGHT = "#F0F4F4";

const BTN_TEAL = { background: BRAND, color: "white", fontSize: 14, fontWeight: 600, padding: "10px 18px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" };
const BTN_TEAL_OUT = { background: BG_CARD, color: BRAND_DARK, fontSize: 13.5, fontWeight: 600, padding: "9px 14px", border: "0.5px solid " + BRAND, borderRadius: 9, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7 };
const BTN_OUT = { background: BG_CARD, color: TEXT_PRIMARY, fontSize: 13.5, fontWeight: 600, padding: "9px 14px", border: "0.5px solid " + BORDER, borderRadius: 9, cursor: "pointer", fontFamily: "inherit" };
const BTN_GHOST = { background: "transparent", color: TEXT_SECONDARY, fontSize: 13.5, fontWeight: 600, padding: "9px 14px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" };
const ICON_BTN = { width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, color: TEXT_SECONDARY, cursor: "pointer" };
const LINK = { color: BRAND_DARK, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const BADGE_PRIMARY = { display: "inline-block", background: BRAND, color: "white", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", padding: "3px 9px", borderRadius: 6 };

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const employeeName = (e) => {
  const f = (e.first_name || "").trim();
  const l = (e.last_name || "").trim();
  if (l && f) return l + ", " + f;
  return e.full_name || e.name || e.email || "Unnamed";
};

const shortAddress = (full) => {
  if (!full) return "";
  const provMatch = full.match(/\b([A-Z]{2})\b/);
  const province = provMatch ? provMatch[1] : "";
  const street = full.split(",")[0].trim();
  return province ? (street + " (" + province + ")") : street;
};

export default function WorkLocation() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = LOCATIONS.find(l => l.id === id);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);

  const goBack = () => navigate("/payroll/items");
  const openAssign = () => setAssignOpen(true);

  useEffect(() => {
    if (!location) { setLoading(false); return; }
    if (!location.isPrimary) { setEmployees([]); setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(API_URL + "/api/v1/payroll/employees", {
          headers: { Authorization: "Bearer " + getToken() },
        });
        if (!res.ok) throw new Error("Could not load employees.");
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.items || data.employees || []);
        const active = list.filter(e => e.status !== "inactive" && e.status !== "terminated");
        setEmployees(active);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id, location]);

  if (!location) {
    return (
      <div style={{ background: BG_CARD, minHeight: "100vh", width: "100%", padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontFamily: "inherit" }}>
        Work location not found. <span style={LINK} onClick={goBack}>Back to Payroll items</span>
      </div>
    );
  }

  const eligible = location.isPrimary ? [] : employees;

  const sorted = [...employees]
    .filter(e => !search || employeeName(e).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const al = (a.last_name || "").toLowerCase();
      const bl = (b.last_name || "").toLowerCase();
      return al < bl ? -1 : al > bl ? 1 : 0;
    });

  const addressShort = shortAddress(location.address);

  return (
    <div style={{ background: BG_CARD, minHeight: "100vh", width: "100%", fontFamily: "inherit" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "0.5px solid " + BORDER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={ICON_BTN} onClick={goBack}><ArrowLeft size={18} /></span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT_INK, margin: 0, letterSpacing: "-0.01em" }}>Work location</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span onClick={() => alert("Feedback form coming next")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: TEXT_SECONDARY, padding: "7px 11px", borderRadius: 8, cursor: "pointer" }}>
            <MessageSquareText size={16} />How can we improve?
          </span>
          <span style={ICON_BTN} onClick={goBack}><X size={18} /></span>
        </div>
      </div>

      <div style={{ padding: "24px 28px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          {location.isPrimary && <div style={{ marginBottom: 8 }}><span style={BADGE_PRIMARY}>PRIMARY</span></div>}
          <div style={{ fontSize: 13, color: TEXT_TERTIARY }}>{location.address}</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: TEXT_INK, margin: "3px 0 0", letterSpacing: "-0.01em" }}>{location.name}</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={LINK} onClick={() => alert("Edit work location coming next")}>Edit</span>
          <button style={BTN_TEAL_OUT} onClick={openAssign}>Assign employee(s)</button>
        </div>
      </div>

      <div style={{ padding: "0 28px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, border: "0.5px solid " + BORDER, borderRadius: 9, padding: "9px 13px", fontSize: 14, flex: 1, maxWidth: 360 }}>
          <Search size={16} style={{ color: TEXT_TERTIARY }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee" style={{ flex: 1, border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, color: TEXT_PRIMARY, background: "transparent" }} />
        </div>
        <button style={BTN_OUT} onClick={() => alert("Filters coming next")}>Filters</button>
      </div>

      <div style={{ padding: "0 28px 24px" }}>
        <div style={{ padding: "12px 4px 10px", borderBottom: "0.5px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_INK, display: "flex", alignItems: "center", gap: 6 }}>
            Employee ({sorted.length})
            <ArrowUp size={14} style={{ color: TEXT_TERTIARY }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: TEXT_TERTIARY }}>ACTION</div>
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: TEXT_SECONDARY, fontSize: 13 }}>Loading employees...</div>
        ) : error ? (
          <div style={{ padding: 12, background: "#FEE2E2", border: "0.5px solid #F87171", borderRadius: 8, color: "#991B1B", fontSize: 13, marginTop: 12 }}>
            <strong>Could not load:</strong> {error}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ border: "1px dashed " + BORDER, borderRadius: 10, padding: 22, color: TEXT_SECONDARY, fontSize: 14, background: BG_PAGE, marginTop: 12 }}>
            No employees at this location yet. <span style={LINK} onClick={openAssign}>Assign employees</span>
          </div>
        ) : (
          sorted.map(emp => (
            <div key={emp.id} style={{ padding: "14px 4px", borderBottom: "0.5px solid " + BORDER_LIGHT, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, color: TEXT_PRIMARY }}>{employeeName(emp)}</div>
                <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginTop: 2 }}>{addressShort}</div>
              </div>
              <span style={LINK} onClick={() => alert("Update tax withholding coming next")}>Update tax withholding</span>
            </div>
          ))
        )}
      </div>

      <div style={{ background: BG_CARD, borderTop: "0.5px solid " + BORDER, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={goBack} style={BTN_GHOST}>Cancel</button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={LINK} onClick={() => alert("Make location inactive coming next")}>Make inactive</span>
          <button onClick={goBack} style={BTN_TEAL}>Done</button>
        </div>
      </div>

      <AssignEmployeesPanel open={assignOpen} onClose={() => setAssignOpen(false)} eligible={eligible} />
    </div>
  );
}

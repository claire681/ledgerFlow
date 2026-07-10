import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronDown, ChevronRight, Filter, Lock,
  MoreVertical, ArrowUp, ArrowDown, FileText, Building2, Printer,
  X, AlertTriangle, MessageCircle, RefreshCw,
} from "lucide-react";

import {
  STATUS, STATUS_LABELS, STATUS_COLORS,
  formatCurrency, formatPeriodShort, employeeNameFromPaycheque,
} from "../utils/paychequeStatus";
import PaychequeFilterPopover from "../components/payroll/PaychequeFilterPopover";
import PaychequeRowMenu from "../components/payroll/PaychequeRowMenu";
import VoidPaychequeModal from "../components/payroll/VoidPaychequeModal";
import DeletePaychequeModal from "../components/payroll/DeletePaychequeModal";

import CreateAdjustmentModal from "../components/payroll/CreateAdjustmentModal";
import AdjustmentGuardModal from "../components/payroll/AdjustmentGuardModal";
import DeleteGuardModal from "../components/payroll/DeleteGuardModal";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const BRAND = "#0F9599";
const BRAND_DARK = "#0F6E56";
const BRAND_SOFT = "#E1F5EE";
const BRAND_SOFT_BORDER = "#B8E2D2";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4B5563";
const TEXT_TERTIARY = "#6B7280";
const BG_CARD = "#FFFFFF";
const BG_PAGE = "#F9FAFB";
const BORDER = "#E5E7EB";
const WARNING_SOFT = "#FEF3C7";
const WARNING_BORDER = "#FCD34D";
const WARNING_BG = "#FFFBEB";

const PRIVACY_KEY = "novala_privacy";
const GRID = "22px 84px 1fr 54px 54px 60px 86px 80px 76px";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  Authorization: "Bearer " + getToken(),
  "Content-Type": "application/json",
});

const formatDateCell = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
};

const getMethodLabel = (method) => {
  if (method === "direct_deposit") return "Dir. dep.";
  if (method === "cheque" || method === "check") return "Cheque";
  return method || "";
};

const isCheque = (m) => (m === "cheque" || m === "check");

export default function PaychequeList() {
  const navigate = useNavigate();
  const filterButtonRef = useRef(null);

  const [paycheques, setPaycheques] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [paySchedules, setPaySchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(new Set());
  const [privacy, setPrivacy] = useState(localStorage.getItem(PRIVACY_KEY) === "on");
  const [sortField, setSortField] = useState("pay_date");
  const [sortDir, setSortDir] = useState("desc");

  const [filter, setFilter] = useState({ employee: "all", paySchedule: "all", datePreset: "last_pay", from: "", to: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState({ top: 0, left: 0 });

  const [editingCheque, setEditingCheque] = useState({});
  const [rowMenuId, setRowMenuId] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
    const [adjustTarget, setAdjustTarget] = useState(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [guardTarget, setGuardTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = authHeaders();
      const [pcRes, empRes, schRes] = await Promise.all([
        fetch(API_URL + "/api/v1/payroll/paycheques", { headers }).catch(() => null),
        fetch(API_URL + "/api/v1/payroll/employees", { headers }).catch(() => null),
        fetch(API_URL + "/api/v1/payroll/pay-schedules", { headers }).catch(() => null),
      ]);

      if (pcRes && pcRes.ok) {
        const data = await pcRes.json();
        setPaycheques(Array.isArray(data) ? data : (data.items || data.paycheques || []));
      } else if (pcRes && pcRes.status === 401) {
        throw new Error("Invalid or expired token. Please log in again.");
      } else {
        setPaycheques([]);
      }

      if (empRes && empRes.ok) {
        const data = await empRes.json();
        setEmployees(Array.isArray(data) ? data : (data.items || data.employees || []));
      }

      if (schRes && schRes.ok) {
        const data = await schRes.json();
        setPaySchedules(Array.isArray(data) ? data : (data.items || data.schedules || []));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePrivacy = () => {
    const next = !privacy;
    setPrivacy(next);
    localStorage.setItem(PRIVACY_KEY, next ? "on" : "off");
  };

  const toggleAll = () => {
    if (selected.size === visiblePaycheques.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visiblePaycheques.map((p) => p.id)));
    }
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const openFilter = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setFilterAnchor({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
    }
    setFilterOpen(true);
  };

  const applyFilter = (next) => {
    setFilter(next);
  };

  const removeFilter = (key) => {
    if (key === "employee") setFilter({ ...filter, employee: "all" });
    else if (key === "paySchedule") setFilter({ ...filter, paySchedule: "all" });
    else if (key === "date") setFilter({ ...filter, datePreset: "last_pay", from: "", to: "" });
  };

  const clearAllFilters = () => setFilter({ employee: "all", paySchedule: "all", datePreset: "last_pay", from: "", to: "" });

  const setSort = (field) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir(field === "pay_date" ? "desc" : "asc"); }
  };

  const sortIcon = (field) => sortField === field ? (sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : null;

  const handleChequeChange = (id, value) => {
    setEditingCheque({ ...editingCheque, [id]: value });
  };

  const handleChequeBlur = async (id) => {
    const value = editingCheque[id];
    if (value === undefined) return;
    const target = paycheques.find((p) => p.id === id);
    if (!target || target.cheque_number === value) return;
    try {
      const res = await fetch(API_URL + "/api/v1/payroll/paycheques/" + id, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ cheque_number: value }),
      });
      if (!res.ok) throw new Error("Could not save cheque number");
      setPaycheques(paycheques.map((p) => p.id === id ? { ...p, cheque_number: value } : p));
    } catch (e) {
      console.warn(e);
    }
  };

  const openPaycheque = (id) => navigate("/payroll/paycheques/" + id);

  const exportExcel = async () => {
      try {
        const res = await fetch(API_URL + "/api/v1/payroll/paycheques/export/excel", {
          headers: authHeaders(),
        });
        if (!res.ok) { alert("Could not export Excel (HTTP " + res.status + ")"); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "paycheques_" + new Date().toISOString().slice(0,10) + ".xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } catch (e) {
        alert("Export failed: " + e.message);
      }
    };

    const exportPdf = async () => {
      try {
        const res = await fetch(API_URL + "/api/v1/payroll/paycheques/export/pdf", {
          headers: authHeaders(),
        });
        if (!res.ok) { alert("Could not export PDF (HTTP " + res.status + ")"); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (e) {
        alert("Export failed: " + e.message);
      }
    };

    const openPaychequePdf = async (paychequeId) => {
    try {
      const res = await fetch(API_URL + "/api/v1/payroll/paycheques/" + paychequeId + "/pdf", {
        headers: authHeaders(),
      });
      if (!res.ok) {
        alert("Could not load pay stub PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      alert("Error loading pay stub: " + e.message);
    }
  };

  const handleRowAction = (paycheque, actionId) => {
    if (actionId === "view") return openPaycheque(paycheque.id);
    if (actionId === "print") { openPaychequePdf(paycheque.id); return; }
    if (actionId === "email") return alert("Email pay stub coming soon");
    if (actionId === "edit") {
        if (paycheque.is_adjustment) return setGuardTarget(paycheque);
        return setAdjustTarget(paycheque);
      }
    if (actionId === "void") return setVoidTarget(paycheque);
    if (actionId === "delete") return setDeleteTarget(paycheque);
  };

  const confirmVoid = async (reason) => {
    if (!voidTarget) return;
    const res = await fetch(API_URL + "/api/v1/payroll/paycheques/" + voidTarget.id + "/void", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Could not void paycheque");
    }
    setPaycheques(paycheques.map((p) => p.id === voidTarget.id ? { ...p, status: STATUS.VOIDED } : p));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(API_URL + "/api/v1/payroll/paycheques/" + deleteTarget.id, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Could not delete paycheque");
    }
    setPaycheques(paycheques.filter((p) => p.id !== deleteTarget.id));
  };

  // Filter the list client-side as a fallback. Backend filter would be preferred.
  const visiblePaycheques = useMemo(() => {
    let list = [...paycheques];

    if (filter.employee && filter.employee !== "all") {
      if (filter.employee === "active") {
        list = list.filter((p) => p.employee_status === "active" || !p.employee_status);
      } else if (filter.employee === "inactive") {
        list = list.filter((p) => ["inactive", "terminated"].includes(p.employee_status));
      } else {
        list = list.filter((p) => p.employee_id === filter.employee);
      }
    }
    if (filter.paySchedule && filter.paySchedule !== "all") {
      list = list.filter((p) => p.pay_schedule_id === filter.paySchedule);
    }
    if (filter.from) list = list.filter((p) => p.pay_date >= filter.from);
    if (filter.to) list = list.filter((p) => p.pay_date <= filter.to);

    list.sort((a, b) => {
      let av, bv;
      if (sortField === "pay_date") { av = a.pay_date || ""; bv = b.pay_date || ""; }
      else if (sortField === "name") {
        av = employeeNameFromPaycheque(a).toLowerCase();
        bv = employeeNameFromPaycheque(b).toLowerCase();
      } else if (sortField === "total") {
        av = parseFloat(a.total_pay || a.gross_pay || 0);
        bv = parseFloat(b.total_pay || b.gross_pay || 0);
      } else if (sortField === "net") {
        av = parseFloat(a.net_pay || 0);
        bv = parseFloat(b.net_pay || 0);
      } else { av = ""; bv = ""; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [paycheques, filter, sortField, sortDir]);

  const totals = useMemo(() => {
    return visiblePaycheques.reduce((acc, p) => ({
      gross: acc.gross + (parseFloat(p.total_pay || p.gross_pay || 0) || 0),
      net: acc.net + (parseFloat(p.net_pay || 0) || 0),
    }), { gross: 0, net: 0 });
  }, [visiblePaycheques]);

  const activeFilters = useMemo(() => {
    const out = [];
    if (filter.employee && filter.employee !== "all") {
      let label = filter.employee;
      const groups = { active: "Active employees", inactive: "Inactive employees" };
      if (groups[filter.employee]) label = groups[filter.employee];
      else {
        const emp = employees.find((e) => e.id === filter.employee);
        if (emp) {
          const last = (emp.last_name || "").trim();
          const first = (emp.first_name || "").trim();
          label = last && first ? last + ", " + first : (emp.name || emp.email || "Unnamed");
        }
      }
      out.push({ key: "employee", category: "Employee:", value: label });
    }
    if (filter.paySchedule && filter.paySchedule !== "all") {
      const sch = paySchedules.find((s) => s.id === filter.paySchedule);
      out.push({ key: "paySchedule", category: "Schedule:", value: sch ? sch.name : filter.paySchedule });
    }
    if (filter.from && filter.to) {
      const fmt = (s) => { const d = new Date(s); return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-CA"); };
      out.push({ key: "date", category: "Range:", value: fmt(filter.from) + " to " + fmt(filter.to) });
    }
    return out;
  }, [filter, employees, paySchedules]);

  const allSelected = visiblePaycheques.length > 0 && selected.size === visiblePaycheques.length;
  const someSelected = selected.size > 0;

  const colHdrStyle = { fontSize: 10, fontWeight: 500, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, userSelect: "none" };

  return (
    <div style={{ position: "relative", padding: 24, paddingRight: 40, background: BG_PAGE, minHeight: "100vh", fontFamily: "inherit" }}>

      <div onClick={() => alert("Feedback widget coming soon")} title="Send feedback" style={{ position: "fixed", right: 0, top: 300, background: BRAND, color: "white", padding: "14px 6px", borderRadius: "4px 0 0 4px", writingMode: "vertical-rl", textOrientation: "mixed", fontSize: 11, fontWeight: 500, letterSpacing: 0.4, cursor: "pointer", zIndex: 10, display: "flex", alignItems: "center", gap: 5 }}>
        <MessageCircle size={13} />Feedback
      </div>

      <a onClick={() => navigate("/payroll/overview")} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: BRAND, fontSize: 13, cursor: "pointer", marginBottom: 14, fontWeight: 500 }}>
        <ChevronLeft size={15} />Back to Overview
      </a>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>Paycheque list</h1>
            <a onClick={() => alert("Feedback coming soon")} style={{ color: BRAND, fontSize: 12, cursor: "pointer" }}>Feedback</a>
          </div>
          <a onClick={() => alert("Paycheque printing setup coming soon")} style={{ display: "inline-block", marginTop: 3, color: BRAND, fontSize: 13, cursor: "pointer" }}>Set up paycheque printing</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div onClick={togglePrivacy} title="Mask money columns" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "4px 6px" }}>
            <div style={{ width: 30, height: 17, borderRadius: 9, background: privacy ? BRAND : "#D1D5DB", position: "relative", transition: "background 0.15s" }}>
              <div style={{ position: "absolute", top: 2, left: privacy ? 15 : 2, width: 13, height: 13, borderRadius: "50%", background: "white", transition: "left 0.15s" }} />
            </div>
            <span style={{ fontSize: 12, color: TEXT_PRIMARY, display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 500 }}>
              <Lock size={12} />Privacy
            </span>
          </div>
          <div style={{ position: "relative", display: "inline-block" }}>
            <button onClick={() => setExportMenuOpen(!exportMenuOpen)} style={{ fontSize: 12, padding: "7px 12px", borderRadius: 6, background: "white", border: "0.5px solid " + BORDER, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, color: TEXT_PRIMARY, fontFamily: "inherit", fontWeight: 500 }}>
              Export <ChevronDown size={12} />
            </button>
            {exportMenuOpen && (
              <>
                <div onClick={() => setExportMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                <div style={{ position: "absolute", top: 38, right: 0, background: "white", border: "1px solid " + BORDER, borderRadius: 10, padding: 4, width: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 50 }}>
                  <div onClick={() => { setExportMenuOpen(false); exportExcel(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#000000", fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.background = "#F0FAFA"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <FileText size={15} style={{ color: "#1A2332" }} />
                    Export to Excel
                  </div>
                  <div onClick={() => { setExportMenuOpen(false); exportPdf(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#000000", fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.background = "#F0FAFA"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <FileText size={15} style={{ color: "#1A2332" }} />
                    Save as PDF
                  </div>
                  <div style={{ height: 1, background: "#E5E7EB", margin: "4px 0" }} />
                  <div onClick={() => { setExportMenuOpen(false); window.print(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#000000", fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.background = "#F0FAFA"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Printer size={15} style={{ color: "#1A2332" }} />
                    Print
                  </div>
                </div>
              </>
            )}
          </div>
          <button onClick={() => alert("More actions coming soon")} title="More" style={{ width: 30, height: 30, borderRadius: 6, background: "white", border: "0.5px solid " + BORDER, cursor: "pointer", color: TEXT_SECONDARY, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <MoreVertical size={14} />
          </button>
          <button onClick={loadAll} title="Refresh" style={{ width: 30, height: 30, borderRadius: 6, background: "white", border: "0.5px solid " + BORDER, cursor: "pointer", color: TEXT_SECONDARY, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <button ref={filterButtonRef} onClick={openFilter} style={{ fontSize: 12, padding: "7px 12px", borderRadius: 6, background: filterOpen ? BRAND_SOFT : "white", border: "0.5px solid " + (filterOpen ? BRAND : BORDER), color: filterOpen ? BRAND_DARK : TEXT_PRIMARY, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "inherit", fontWeight: 500 }}>
          <Filter size={13} />Filter <ChevronDown size={11} />
        </button>
        {someSelected && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 14px", background: BRAND_SOFT, border: "0.5px solid " + BRAND_SOFT_BORDER, borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: BRAND_DARK, fontWeight: 500 }}>{selected.size} selected</span>
            <span style={{ color: BRAND_SOFT_BORDER }}>|</span>
            <span onClick={() => alert("Bulk print coming soon")} style={{ fontSize: 12, color: BRAND_DARK, cursor: "pointer" }}>Print stubs</span>
            <span onClick={() => alert("Bulk mark printed coming soon")} style={{ fontSize: 12, color: BRAND_DARK, cursor: "pointer" }}>Mark printed</span>
          </div>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: TEXT_SECONDARY, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.4, marginRight: 4 }}>Filters</span>
          {activeFilters.map((f) => (
            <span key={f.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: BRAND_SOFT, border: "0.5px solid " + BRAND_SOFT_BORDER, borderRadius: 12, fontSize: 11, color: BRAND_DARK }}>
              <span style={{ color: TEXT_SECONDARY }}>{f.category}</span>
              <span style={{ fontWeight: 500 }}>{f.value}</span>
              <X size={11} onClick={() => removeFilter(f.key)} style={{ cursor: "pointer", opacity: 0.7 }} />
            </span>
          ))}
          <span onClick={clearAllFilters} style={{ fontSize: 12, color: BRAND, cursor: "pointer", fontWeight: 500, marginLeft: 4 }}>Clear all</span>
        </div>
      )}

      {error && (
        <div style={{ padding: 12, background: "#FEE2E2", border: "0.5px solid #F87171", borderRadius: 8, color: "#991B1B", fontSize: 13, marginBottom: 14 }}>
          <strong>Could not load:</strong> {error}
        </div>
      )}

      <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 8 }}>

        <div style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", columnGap: 6, padding: "9px 12px", background: BG_PAGE, borderBottom: "0.5px solid " + BORDER }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ margin: 0, width: 13, height: 13 }} />
          <div onClick={() => setSort("pay_date")} style={colHdrStyle}>Pay date {sortIcon("pay_date")}</div>
          <div onClick={() => setSort("name")} style={colHdrStyle}>Name {sortIcon("name")}</div>
          <div onClick={() => setSort("total")} style={{ ...colHdrStyle, justifyContent: "flex-end", textAlign: "right" }}>Total {sortIcon("total")}</div>
          <div onClick={() => setSort("net")} style={{ ...colHdrStyle, justifyContent: "flex-end", textAlign: "right" }}>Net {sortIcon("net")}</div>
          <div style={{ ...colHdrStyle, cursor: "default" }}>Method</div>
          <div style={{ ...colHdrStyle, cursor: "default" }}>Cheque #</div>
          <div style={{ ...colHdrStyle, cursor: "default" }}>Status</div>
          <div style={{ ...colHdrStyle, cursor: "default" }}>Action</div>
        </div>

        {loading && paycheques.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: TEXT_SECONDARY, fontSize: 13 }}>Loading...</div>
        ) : visiblePaycheques.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontSize: 13 }}>
            {paycheques.length === 0 ? "No paycheques yet. They appear here after a pay run." : "No paycheques match your filters."}
          </div>
        ) : visiblePaycheques.map((pc) => {
          const isSelected = selected.has(pc.id);
          const status = pc.status || STATUS.PENDING;
          const isVoided = status === STATUS.VOIDED;
          const isPending = status === STATUS.PENDING;
          const isChqMethod = isCheque(pc.pay_method);
          const chequeValue = editingCheque[pc.id] !== undefined ? editingCheque[pc.id] : (pc.cheque_number || "");
          const pillColors = STATUS_COLORS[status] || STATUS_COLORS.pending;
          const rowOpacity = isVoided ? 0.7 : 1;
          const rowColor = isVoided ? TEXT_TERTIARY : TEXT_PRIMARY;
        const isAdjustment = pc.is_adjustment === true;

          return (
            <div
              key={pc.id}
              onClick={() => openPaycheque(pc.id)}
              style={{
                display: "grid", gridTemplateColumns: GRID, alignItems: "center", columnGap: 6,
                padding: "11px 12px", borderBottom: "0.5px solid #F3F4F6",
                fontSize: 11, color: rowColor, opacity: rowOpacity,
                background: isAdjustment ? "#FEF3C7" : (isSelected ? "#F0FAFA" : "white"),
                cursor: "pointer",
              }}
              onMouseOver={(e) => { if (!isSelected && !isVoided && !isAdjustment) e.currentTarget.style.background = "#FAFBFC"; }}
              onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = isAdjustment ? "#FEF3C7" : "white"; }}
            >
              <input type="checkbox" checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={() => toggleOne(pc.id)} style={{ margin: 0, width: 13, height: 13, accentColor: BRAND }} />

              <div>
                <div style={{ fontWeight: 500, textDecoration: isVoided ? "line-through" : "none" }}>{formatDateCell(pc.pay_date)}</div>
                {(pc.pay_period_start || pc.payPeriod) && (
                  <div style={{ fontSize: 10, color: TEXT_TERTIARY }}>
                    {formatPeriodShort(pc.pay_period_start || (pc.payPeriod && pc.payPeriod.start), pc.pay_period_end || (pc.payPeriod && pc.payPeriod.end))}
                  </div>
                )}
              </div>

              <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: isVoided ? "line-through" : "none" }}><span>{employeeNameFromPaycheque(pc)}</span>{isAdjustment && (<span style={{ fontSize: 9, fontWeight: 700, color: "#92400E", background: "#FDE68A", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.3px", textTransform: "uppercase", marginLeft: 6 }}>Adjustment</span>)}</div>

              <div style={{ textAlign: "right", textDecoration: isVoided ? "line-through" : "none" }}>
                {privacy ? <span style={{ fontFamily: "monospace", color: TEXT_TERTIARY, letterSpacing: 1 }}>{"\u2022\u2022\u2022\u2022"}</span> : formatCurrency(pc.total_pay || pc.gross_pay, pc.currency)}
              </div>
              <div style={{ textAlign: "right", fontWeight: 500, textDecoration: isVoided ? "line-through" : "none" }}>
                {privacy ? <span style={{ fontFamily: "monospace", color: TEXT_TERTIARY, letterSpacing: 1 }}>{"\u2022\u2022\u2022\u2022"}</span> : formatCurrency(pc.net_pay, pc.currency)}
              </div>

              <div style={{ color: TEXT_SECONDARY, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11 }}>
                {isChqMethod ? <FileText size={11} /> : <Building2 size={11} />}
                {getMethodLabel(pc.pay_method)}
              </div>

              {isChqMethod ? (
                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    value={chequeValue}
                    onChange={(e) => handleChequeChange(pc.id, e.target.value)}
                    onBlur={() => handleChequeBlur(pc.id)}
                    disabled={isVoided}
                    placeholder={isPending ? "Cheque #" : ""}
                    style={{
                      flex: 1, minWidth: 0, padding: "5px 6px", fontSize: 11,
                      border: "1px solid " + (isPending && !chequeValue ? WARNING_BORDER : BORDER),
                      borderRadius: 4, fontFamily: "inherit",
                      color: isVoided ? TEXT_TERTIARY : TEXT_PRIMARY,
                      boxSizing: "border-box",
                      background: isPending && !chequeValue ? WARNING_BG : (isVoided ? BG_PAGE : "white"),
                      textDecoration: isVoided ? "line-through" : "none",
                    }}
                  />
                  <ChevronRight onClick={(e) => { e.stopPropagation(); openPaycheque(pc.id); }} size={14} style={{ color: isVoided ? TEXT_TERTIARY : BRAND, cursor: "pointer", flexShrink: 0 }} />
                </div>
              ) : (
                <div style={{ color: TEXT_TERTIARY, fontSize: 11, paddingLeft: 6 }}>N/A</div>
              )}

              <div>
                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: pillColors.bg, color: pillColors.fg }}>
                  {STATUS_LABELS[status] || status}
                </span>
              </div>

              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 1 }} onClick={(e) => e.stopPropagation()}>
                <span onClick={() => handleRowAction(pc, "print")} style={{ color: isVoided ? TEXT_TERTIARY : BRAND, fontWeight: 500, cursor: isVoided ? "not-allowed" : "pointer", fontSize: 11 }}>Print stub</span>
                <ChevronDown onClick={() => setRowMenuId(rowMenuId === pc.id ? null : pc.id)} size={18} style={{ color: isVoided ? TEXT_TERTIARY : TEXT_SECONDARY, cursor: "pointer", padding: 4, borderRadius: 4, background: rowMenuId === pc.id ? "#F3F4F6" : "transparent" }} />
                <PaychequeRowMenu
                  open={rowMenuId === pc.id}
                  onClose={() => setRowMenuId(null)}
                  onAction={(actionId) => handleRowAction(pc, actionId)}
                  filedOrRemitted={pc.filed_or_remitted}
                  voided={isVoided}
                />
              </div>
            </div>
          );
        })}

      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 11, color: TEXT_SECONDARY }}>
        <span>Showing {visiblePaycheques.length} of {paycheques.length} paycheques{activeFilters.length > 0 ? " · " + activeFilters.length + " filter" + (activeFilters.length === 1 ? "" : "s") + " applied" : ""}</span>
        <span>Total gross: {formatCurrency(totals.gross)} · Total net: {formatCurrency(totals.net)}</span>
      </div>

      <PaychequeFilterPopover
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        anchor={filterAnchor}
        initial={filter}
        employees={employees}
        paySchedules={paySchedules}
        onApply={applyFilter}
      />

      <AdjustmentGuardModal
        open={!!guardTarget}
        onClose={() => setGuardTarget(null)}
        stub={guardTarget}
        onVoid={() => {
          if (guardTarget) setVoidTarget(guardTarget);
        }}
      />

      <CreateAdjustmentModal
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        originalStub={adjustTarget}
        onCreated={(data) => {
          // Refresh the list to show the new adjustment
          fetch(API_URL + "/api/v1/payroll/paycheques", { headers: authHeaders() })
            .then(r => r.json())
            .then(setPaycheques)
            .catch(() => {});
        }}
      />

      <VoidPaychequeModal
        open={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        paycheque={voidTarget}
        onConfirm={confirmVoid}
      />

      <DeleteGuardModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        stub={deleteTarget}
        onVoid={() => { if (deleteTarget) setVoidTarget(deleteTarget); }}
      />

      <style>{"@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

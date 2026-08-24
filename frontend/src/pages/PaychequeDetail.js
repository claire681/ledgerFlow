import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  HelpCircle, X, ChevronDown, BookOpen, Printer,
  RotateCcw, Trash2, Edit, AlertTriangle,
} from "lucide-react";

import {
  formatCurrency, formatDate, formatPeriodLong, employeeNameFromPaycheque,
} from "../utils/paychequeStatus";
import PayStub from "../components/payroll/PayStub";
import CreateAdjustmentModal from "../components/payroll/CreateAdjustmentModal";
import AdjustmentGuardModal from "../components/payroll/AdjustmentGuardModal";
import VoidPaychequeModal from "../components/payroll/VoidPaychequeModal";
import DeletePaychequeModal from "../components/payroll/DeletePaychequeModal";
import DeleteGuardModal from "../components/payroll/DeleteGuardModal";
import apiFetch from "../utils/apiFetch";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const BRAND = "#0F9599";
const BRAND_DARK = "#0F6E56";
const BRAND_SOFT = "#E1F5EE";
const BRAND_SOFT_BORDER = "#B8E2D2";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const TEXT_TERTIARY = "#9CA3AF";
const BG_CARD = "#FFFFFF";
const BG_PAGE = "#F9FAFB";
const BORDER = "#E5E7EB";
const WARNING = "#B45309";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  Authorization: "Bearer " + getToken(),
  "Content-Type": "application/json",
});

function Section({ title, expanded, onToggle, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: "0.5px solid " + BORDER, cursor: "pointer" }}>
        <ChevronDown size={14} style={{ color: TEXT_SECONDARY, transform: expanded ? "none" : "rotate(-90deg)", transition: "transform 0.15s" }} />
        <h3 style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>{title}</h3>
      </div>
      {expanded && children}
    </div>
  );
}

function PayTable({ lines = [], total }) {
  return (
    <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderTop: "none", borderRadius: "0 0 6px 6px", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 70px 80px 80px", alignItems: "center", padding: "8px 14px", background: BG_PAGE, borderBottom: "0.5px solid " + BORDER, fontSize: 10, fontWeight: 500, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4 }}>
        <div>Type</div>
        <div style={{ textAlign: "right" }}>Hours</div>
        <div style={{ textAlign: "right" }}>Rate</div>
        <div style={{ textAlign: "right" }}>Current</div>
        <div style={{ textAlign: "right" }}>YTD</div>
      </div>
      {lines.map((l, i) => {
        const STAT_AMBER_BG = "#FEF6E7";
        const isStat = /stat|holiday/i.test(l.type || l.label || "");
        const subtitle = l.holiday_name || l.subtitle || null;
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 56px 70px 80px 80px", alignItems: "center", padding: "9px 14px", fontSize: 12, color: TEXT_PRIMARY, borderBottom: "0.5px solid #F3F4F6", background: isStat ? STAT_AMBER_BG : "transparent" }}>
            <div style={{ fontWeight: isStat ? 700 : "inherit" }}>
              {l.type}
              {isStat && subtitle && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "#0E1A1A", marginTop: 2 }}>{subtitle}</div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>{l.hours != null ? Number(l.hours).toFixed(2) : ""}</div>
            <div style={{ textAlign: "right" }}>{l.rate != null ? formatCurrency(l.rate) : ""}</div>
            <div style={{ textAlign: "right", fontWeight: isStat ? 700 : "inherit" }}>{formatCurrency(l.current)}</div>
            <div style={{ textAlign: "right" }}>{formatCurrency(l.ytd)}</div>
          </div>
        );
      })}
      {total && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 70px 80px 80px", alignItems: "center", padding: "9px 14px", fontSize: 12, color: TEXT_PRIMARY, background: BG_PAGE, fontWeight: 500 }}>
          <div>Total</div><div></div><div></div>
          <div style={{ textAlign: "right" }}>{formatCurrency(total.current)}</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(total.ytd)}</div>
        </div>
      )}
    </div>
  );
}

function TaxTable({ lines = [], total }) {
  return (
    <div style={{ background: BG_CARD, border: "0.5px solid " + BORDER, borderTop: "none", borderRadius: "0 0 6px 6px", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", alignItems: "center", padding: "8px 14px", background: BG_PAGE, borderBottom: "0.5px solid " + BORDER, fontSize: 10, fontWeight: 500, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4 }}>
        <div>Type</div>
        <div style={{ textAlign: "right" }}>Current</div>
        <div style={{ textAlign: "right" }}>YTD</div>
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", alignItems: "center", padding: "9px 14px", fontSize: 12, color: TEXT_PRIMARY, borderBottom: "0.5px solid #F3F4F6" }}>
          <div>{l.type}</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(l.current)}</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(l.ytd)}</div>
        </div>
      ))}
      {total && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", alignItems: "center", padding: "9px 14px", fontSize: 12, color: TEXT_PRIMARY, background: BG_PAGE, fontWeight: 500 }}>
          <div>Total</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(total.current)}</div>
          <div style={{ textAlign: "right" }}>{formatCurrency(total.ytd)}</div>
        </div>
      )}
    </div>
  );
}

export default function PaychequeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [pc, setPc] = useState(null);
    const [adjustOpenModal, setAdjustOpenModal] = useState(false);
    const [guardOpenModal, setGuardOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memo, setMemo] = useState("");
  const [expanded, setExpanded] = useState({ pay: true, employee_taxes: true, employer_taxes: true, deductions: true });
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const adjustRef = useRef(null);

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!adjustOpen) return;
    const onClick = (e) => {
      if (adjustRef.current && !adjustRef.current.contains(e.target)) setAdjustOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [adjustOpen]);

  const queryClient = useQueryClient();

  // React Query: paycheque detail
  const { data: paychequeData, isLoading: qLoading, error: qError } = useQuery({
    queryKey: ["paycheque-detail", id],
    queryFn: async function() {
      const res = await apiFetch("/api/v1/payroll/paycheques/" + id, { headers: authHeaders() });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid or expired token. Please log in again.");
        if (res.status === 404) throw new Error("Paycheque not found.");
        throw new Error("Could not load paycheque");
      }
      return await res.json();
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  // Sync into legacy state
  useEffect(function() {
    if (paychequeData) {
      setPc(paychequeData);
      setMemo(paychequeData.memo || "");
      try {
        const safeName = (paychequeData.employee_name || 'employee').replace(/[^A-Za-z0-9_-]/g, '_');
        const dateStr = paychequeData.pay_date || paychequeData.pay_period_end || '';
        document.title = 'paystub_' + safeName + '_' + dateStr;
      } catch (e) {}
    }
    setLoading(qLoading);
    if (qError) setError(qError.message);
  }, [paychequeData, qLoading, qError]);

  function load() {
    queryClient.invalidateQueries({ queryKey: ["paycheque-detail", id] });
  };

  const saveMemo = async () => {
    if (!pc) return;
    if (memo === (pc.memo || "")) return;
    try {
      await apiFetch("/api/v1/payroll/paycheques/" + pc.id, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ memo }),
      });
      setPc({ ...pc, memo });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleVoid = async (reason) => {
    const res = await apiFetch("/api/v1/payroll/paycheques/" + pc.id + "/void", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Could not void paycheque");
    }
    setPc({ ...pc, status: "voided" });
  };

  const handleDelete = async () => {
    const res = await apiFetch("/api/v1/payroll/paycheques/" + pc.id, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Could not delete paycheque");
    }
    navigate(-1);
  };

  const close = () => {
    // If page was opened in a new tab (no history), close the tab.
    // Otherwise, go back to the previous page in history.
    if (window.history.length > 1 && document.referrer) {
      navigate(-1);
    } else {
      // Try to close the window (works if opened by window.open)
      window.close();
      // If close didn't work (browser blocked it), fall back to paycheques list
      setTimeout(() => { navigate("/payroll/paycheques"); }, 100);
    }
  };

  const totalDeductions = useMemo(() => {
    if (!pc || !pc.deductions_contributions || !pc.deductions_contributions.total) return 0;
    return parseFloat(pc.deductions_contributions.total.current || 0) || 0;
  }, [pc]);

  // Auto-trigger browser print dialog when URL has ?print=1  (used from paycheque list kebab menu)
  var isPrintMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("print") === "1";

  useEffect(function() { /* useAutoPrint_added_by_patch */
    if (!pc || !isPrintMode) return;
    // Set document title so PDF filename is meaningful
    var name = (pc.employee_name || "Employee").replace(/[^a-zA-Z0-9 -]/g, "");
    var dateStr = "";
    if (pc.pay_date) {
      var d = new Date(pc.pay_date);
      if (!isNaN(d)) {
        var dd = String(d.getUTCDate()).padStart(2, "0");
        var mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        dateStr = dd + "-" + mm + "-" + d.getUTCFullYear();
      }
    }
    document.title = "Pay stub - " + name + (dateStr ? " - " + dateStr : "");
    // Fire immediately after render
    var timer = setTimeout(function() { window.print(); }, 100);
    return function() { clearTimeout(timer); };
  }, [pc, isPrintMode]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontFamily: "inherit" }}>Loading...</div>;
  }
  if (error || !pc) {
    return (
      <div style={{ padding: 40, fontFamily: "inherit", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "#991B1B", marginBottom: 12 }}>{error || "Paycheque not available."}</div>
        <button onClick={close} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: BRAND, color: "white", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Back to list</button>
      </div>
    );
  }

  const name = employeeNameFromPaycheque(pc);
  const grossLabel = formatCurrency(pc.total_pay || pc.gross_pay || (pc.pay && pc.pay.total && pc.pay.total.current), pc.currency);
  const netLabel = formatCurrency(pc.net_pay, pc.currency);
  const empTaxTotal = pc.employee_taxes && pc.employee_taxes.total ? parseFloat(pc.employee_taxes.total.current || 0) : 0;

  return (
    <div className="paycheque-print-area" style={{ background: BG_CARD, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
      <style>{`
        @page {
          margin: 12mm 10mm;
          size: A4;
        }
        @media print {
        [data-print="hide"], [data-print='hide'], .no-print { display: none !important; }
        html, body { background: white !important; }
        body * { visibility: hidden; }
        .paystub-container, .paystub-container * { visibility: visible; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .paystub-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; display: block !important; }
      }
    @media screen {
          .pay-stub-print-only { display: none; }
        }
      `}</style>

      <div className="paystub-container" style={{ padding: "24px", background: "#F4F6F8", display: "flex", justifyContent: "center" }}>
        <PayStub data={pc} />
      </div>

      <div className="no-print" style={{ padding: "12px 20px", borderBottom: "0.5px solid #F3F4F6", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        <div ref={adjustRef} style={{ position: "relative" }}>
          <button onClick={() => setAdjustOpen(!adjustOpen)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 5, background: "white", border: "0.5px solid " + BORDER, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, color: TEXT_PRIMARY, fontWeight: 500, fontFamily: "inherit" }}>
            Make adjustment <ChevronDown size={11} />
          </button>
          {adjustOpen && (
            <div style={{ position: "absolute", right: 0, top: 36, background: "white", border: "0.5px solid " + BORDER, borderRadius: 8, padding: 4, width: 180, zIndex: 50, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <div onClick={() => { setAdjustOpen(false); if (pc && pc.is_adjustment) { setGuardOpenModal(true); } else { setAdjustOpenModal(true); } }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, color: TEXT_PRIMARY }}>
                <Edit size={13} style={{ color: TEXT_SECONDARY }} />Edit
              </div>
              <div onClick={() => { setAdjustOpen(false); setVoidOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, color: WARNING }}>
                <RotateCcw size={13} />Void
              </div>
              <div onClick={() => { setAdjustOpen(false); setDeleteOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12, color: "#DC2626" }}>
                <Trash2 size={13} />Delete
              </div>
            </div>
          )}
        </div>
        <HelpCircle size={18} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} onClick={() => alert("Help coming soon")} />
        <X size={18} style={{ color: TEXT_SECONDARY, cursor: "pointer" }} onClick={close} />
      </div>

      <div className="no-print" style={{ flex: 1, overflowY: "auto", padding: "20px 24px 100px", maxWidth: 880, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {pc && pc.is_adjustment && (
            <div className="no-print" style={{
              background: "#FEF3C7", border: "1px solid #FDE68A",
              borderRadius: 8, padding: "12px 14px", marginBottom: 18,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "#FDE68A", color: "#92400E",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 2,
              }}>
                <AlertTriangle size={16} strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 11, color: "#92400E",
                  letterSpacing: "0.5px", textTransform: "uppercase",
                  fontWeight: 700, marginBottom: 3,
                }}>Adjustment cheque</div>
                <div style={{ fontSize: 13, color: "#1A2332", fontWeight: 600, marginBottom: 4 }}>
                  This pay stub was created to correct a previous pay stub.
                </div>
                {pc.adjustment_reason && (
                  <div style={{ fontSize: 12.5, color: "#1A2332", fontWeight: 500 }}>
                    <span style={{ fontWeight: 700 }}>Reason:</span> {pc.adjustment_reason}
                  </div>
                )}
              </div>
            </div>
          )}

<div style={{ marginBottom: 4 }}>
          <label style={{ display: "block", fontSize: 10, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500, marginBottom: 6 }}>Memo</label>
          <textarea
            rows={2}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={saveMemo}
            placeholder="Add a note for this paycheque (saved with the record)"
            style={{ width: "100%", padding: "8px 10px", fontSize: 12, borderRadius: 5, border: "0.5px solid " + BORDER, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", color: TEXT_PRIMARY }}
          />
        </div>
      </div>

      <div className="no-print" style={{ padding: "12px 24px", borderTop: "0.5px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: BG_CARD, position: "fixed", bottom: 0, left: 0, right: 0, boxShadow: "0 -4px 12px rgba(0,0,0,0.06)", zIndex: 100 }}>
        <button onClick={close} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: "white", color: TEXT_PRIMARY, border: "0.5px solid " + BORDER, cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>Close</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => alert("Transaction journal coming soon")} style={{ fontSize: 12, padding: "8px 14px", borderRadius: 5, background: "white", color: BRAND, border: "0.5px solid " + BRAND, cursor: "pointer", fontWeight: 500, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <BookOpen size={13} />Transaction journal
          </button>
          <button onClick={() => window.print()} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 5, background: BRAND, color: "white", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Printer size={13} />Print pay stub
          </button>
        </div>
      </div>

      <CreateAdjustmentModal
        open={adjustOpenModal}
        onClose={() => setAdjustOpenModal(false)}
        originalStub={pc}
        onCreated={() => { window.location.reload(); }}
      />
      <AdjustmentGuardModal
        open={guardOpenModal}
        onClose={() => setGuardOpenModal(false)}
        stub={pc}
        onVoid={() => setVoidOpen(true)}
      />
      <VoidPaychequeModal open={voidOpen} onClose={() => setVoidOpen(false)} paycheque={pc} onConfirm={handleVoid} />
      <DeleteGuardModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        stub={pc}
        onVoid={() => setVoidOpen(true)}
      />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";
const FONT = "Inter, -apple-system, sans-serif";

const C = {
  ink: "#0E1A1A",
  brand: "#15A08C",
  brandDark: "#0F6E56",
  brandBg: "#E1F5EE",
  brandDarkText: "#04342C",
  muted: "#1A2332",
  faint: "#6B7280",
  line: "#E5E7EB",
  lineSoft: "#F1F3F7",
  page: "#F8F9FA",
  danger: "#A32D2D",
  amber: "#854F0B",
  amberBg: "#FAEEDA",
};

function authHeaders() {
  const t = localStorage.getItem("access_token") || localStorage.getItem("token");
  return { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
}

function fmtDateShort(iso) {
  if (!iso) return "-";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-CA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMoney(n) {
  if (n == null) return "-";
  return "$" + Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeAge(createdIso) {
  if (!createdIso) return { label: "Unknown", days: 0, color: C.faint };
  const created = new Date(createdIso);
  const ageMs = Date.now() - created.getTime();
  const days = Math.floor(ageMs / 86400000);
  let label, color;
  if (days === 0) { label = "Today"; color = C.faint; }
  else if (days === 1) { label = "1 day ago"; color = C.faint; }
  else if (days < 5) { label = days + " days ago"; color = C.faint; }
  else if (days === 5) { label = "5 days ago"; color = C.amber; }
  else if (days === 6) { label = "6 days \u00b7 deletes tomorrow"; color = C.danger; }
  else { label = days + " days ago"; color = C.danger; }
  return { label, days, color };
}

export default function PayrollDrafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(function() {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const r = await fetch(API + "/api/v1/payroll/runs?status=draft", { headers: authHeaders() });
        if (!r.ok) throw new Error("Failed to load drafts");
        const data = await r.json();
        setDrafts(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredDrafts = useMemo(function() {
    let list = drafts;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(function(d) {
        return (fmtDateShort(d.pay_period_start).includes(q) ||
                fmtDateShort(d.pay_period_end).includes(q) ||
                fmtDateShort(d.pay_date).includes(q));
      });
    }
    list = list.slice().sort(function(a, b) {
      if (sortBy === "newest") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === "period") return new Date(a.pay_period_start || 0) - new Date(b.pay_period_start || 0);
      if (sortBy === "gross") return Number(b.total_gross || 0) - Number(a.total_gross || 0);
      return 0;
    });
    return list;
  }, [drafts, searchQuery, sortBy]);

  const visibleDrafts = filteredDrafts.slice(0, visibleCount);

  function toggleSelect(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleSelectAll() {
    if (selected.size === visibleDrafts.length) setSelected(new Set());
    else setSelected(new Set(visibleDrafts.map(function(d) { return d.id; })));
  }

  function clearSelection() { setSelected(new Set()); }

  async function deleteDraft(id) {
    try {
      const r = await fetch(API + "/api/v1/payroll/runs/" + id, { method: "DELETE", headers: authHeaders() });
      if (r.ok || r.status === 204) {
        setDrafts(function(prev) { return prev.filter(function(d) { return d.id !== id; }); });
        const next = new Set(selected);
        next.delete(id);
        setSelected(next);
      } else {
        window.alert("Failed to delete draft");
      }
    } catch (e) {
      window.alert("Error: " + e.message);
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!window.confirm("Delete " + selected.size + " draft pay run" + (selected.size === 1 ? "" : "s") + "? This cannot be undone.")) return;
    const ids = Array.from(selected);
    let deleted = 0;
    for (const id of ids) {
      try {
        const r = await fetch(API + "/api/v1/payroll/runs/" + id, { method: "DELETE", headers: authHeaders() });
        if (r.ok || r.status === 204) deleted++;
      } catch (e) { console.error(e); }
    }
    setDrafts(function(prev) { return prev.filter(function(d) { return !ids.includes(d.id); }); });
    setSelected(new Set());
    window.alert("Deleted " + deleted + " draft" + (deleted === 1 ? "" : "s"));
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px", fontFamily: FONT }}>
        <div style={{ padding: 40, color: C.muted, textAlign: "center" }}>Loading draft pay runs...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 90px", fontFamily: FONT }}>

      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 12, color: C.faint, marginBottom: 8 }}>
          <span onClick={function() { navigate("/payroll"); }} style={{ color: C.brandDark, cursor: "pointer", fontWeight: 600 }}>Payroll</span> &rsaquo; Draft pay runs
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.brand, letterSpacing: "0.5px", marginBottom: 4 }}>PAYROLL</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.ink }}>Draft pay runs</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{drafts.length} {drafts.length === 1 ? "draft" : "drafts"} &middot; Auto-delete after 7 days</div>
          </div>
          <button onClick={function() { navigate("/payroll/run"); }} style={{ background: C.ink, color: "white", border: "none", padding: "10px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>+ Create pay run</button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FCEBEB", borderRadius: 8, color: "#791F1F", fontSize: 13, marginBottom: 14 }}>{error}</div>
      )}

      {drafts.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 12, padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 8 }}>No draft pay runs</div>
          <div style={{ fontSize: 13, color: C.muted }}>When you start a payroll, it appears here until you finalize it.</div>
        </div>
      )}

      {drafts.length > 0 && (
        <>
          <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 12, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <input type="text" placeholder="Search by period or pay date..." value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value); }} style={{ flex: 1, padding: "9px 14px", border: "1px solid " + C.line, borderRadius: 8, fontSize: 13, color: C.ink, fontFamily: FONT }} />
            <select value={sortBy} onChange={function(e) { setSortBy(e.target.value); }} style={{ padding: "8px 14px", border: "1px solid " + C.line, borderRadius: 8, fontSize: 13, color: C.ink, fontWeight: 600, background: "#fff", fontFamily: FONT, cursor: "pointer" }}>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="period">Sort: Pay period</option>
              <option value="gross">Sort: Gross</option>
            </select>
          </div>

          {selected.size > 0 && (
            <div style={{ background: "linear-gradient(90deg, " + C.brandBg + ", #F1F8F6)", border: "1px solid " + C.brand, borderRadius: 10, padding: "10px 18px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, color: C.brandDarkText, fontWeight: 600 }}>{selected.size} draft{selected.size === 1 ? "" : "s"} selected</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={clearSelection} style={{ background: "transparent", border: "1px solid " + C.brand, color: C.brandDark, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Clear selection</button>
                <button onClick={bulkDelete} style={{ background: C.danger, color: "white", border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Delete {selected.size} draft{selected.size === 1 ? "" : "s"}</button>
              </div>
            </div>
          )}

          <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 12, overflow: "visible" }}>
            <div style={{ padding: "12px 20px", background: C.page, borderBottom: "1px solid " + C.line, display: "grid", gridTemplateColumns: "26px 2fr 1fr 1fr 1.2fr 100px 30px", gap: 16, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>
              <div>
                <input type="checkbox" checked={visibleDrafts.length > 0 && selected.size === visibleDrafts.length} onChange={toggleSelectAll} style={{ accentColor: C.brand, cursor: "pointer" }} />
              </div>
              <div>PAY PERIOD</div>
              <div>EMPLOYEES</div>
              <div>GROSS</div>
              <div>CREATED</div>
              <div></div>
              <div></div>
            </div>

            {visibleDrafts.length === 0 && (
              <div style={{ padding: 30, textAlign: "center", color: C.muted, fontSize: 14 }}>No drafts match your search.</div>
            )}

            {visibleDrafts.map(function(d, idx) {
              const isLast = idx === visibleDrafts.length - 1;
              const isSelected = selected.has(d.id);
              const age = computeAge(d.created_at);
              return (
                <div key={d.id} style={{ padding: "14px 20px", borderBottom: isLast ? "none" : "1px solid " + C.lineSoft, display: "grid", gridTemplateColumns: "26px 2fr 1fr 1fr 1.2fr 100px 30px", gap: 16, alignItems: "center", background: isSelected ? C.brandBg : "transparent", position: "relative" }}>
                  <div>
                    <input type="checkbox" checked={isSelected} onChange={function() { toggleSelect(d.id); }} style={{ accentColor: C.brand, cursor: "pointer" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{fmtDateShort(d.pay_period_start)} to {fmtDateShort(d.pay_period_end)}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Pay {fmtDateShort(d.pay_date)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted }}>{d.employee_count || 0} employee{(d.employee_count || 0) === 1 ? "" : "s"}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>{d.total_gross ? fmtMoney(d.total_gross) : "-"}</div>
                  <div style={{ fontSize: 12, color: age.color, fontWeight: age.days >= 5 ? 600 : 400 }}>{age.label}</div>
                  <button onClick={function() { navigate("/payroll/run/" + d.id); }} style={{ background: C.brand, color: "white", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Resume</button>
                  <div style={{ position: "relative", textAlign: "center" }}>
                    <button onClick={function(e) { e.stopPropagation(); setOpenMenuId(openMenuId === d.id ? null : d.id); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: 2 }}>&#8942;</button>
                    {openMenuId === d.id && (
                      <div style={{ position: "absolute", top: 28, right: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", width: 170, overflow: "hidden", zIndex: 20, textAlign: "left" }}>
                        <div onClick={function() { navigate("/payroll/run/" + d.id); setOpenMenuId(null); }} style={{ padding: "10px 14px", fontSize: 13, color: C.ink, cursor: "pointer" }}>Resume</div>
                        <div onClick={function() { if (window.confirm("Delete this draft?")) { deleteDraft(d.id); } setOpenMenuId(null); }} style={{ padding: "10px 14px", fontSize: 13, color: C.danger, cursor: "pointer", borderTop: "1px solid " + C.lineSoft }}>Delete draft</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDrafts.length > visibleCount && (
            <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: C.muted }}>
              Showing {visibleCount} of {filteredDrafts.length} &middot;{" "}
              <a onClick={function() { setVisibleCount(visibleCount + 20); }} style={{ color: C.brandDark, cursor: "pointer", fontWeight: 600 }}>Load more</a>
            </div>
          )}
        </>
      )}

    </div>
  );
}
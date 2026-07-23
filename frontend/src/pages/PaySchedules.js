import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PayScheduleModal from "../components/PayScheduleModal";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

function authHeaders() {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    return { "Authorization": "Bearer " + token, "Content-Type": "application/json" };
}

function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function periodBadgeColor(freq) {
    const f = (freq || "").toLowerCase();
    if (f.includes("semi") || f === "semimonthly") return "#15A08C";
    if (f.includes("bi") || f === "biweekly") return "#7F77DD";
    if (f === "monthly") return "#EF9F27";
    if (f === "weekly") return "#D85A30";
    return "#5F5E5A";
}

function periodBadgeBg(freq) {
    const f = (freq || "").toLowerCase();
    if (f.includes("semi") || f === "semimonthly") return "#E1F5EE";
    if (f.includes("bi") || f === "biweekly") return "#EEEDFE";
    if (f === "monthly") return "#FAEEDA";
    if (f === "weekly") return "#FAECE7";
    return "#F1EFE8";
}

function periodBadgeText(freq) {
    const f = (freq || "").toLowerCase();
    if (f.includes("semi") || f === "semimonthly") return "#04342C";
    if (f.includes("bi") || f === "biweekly") return "#26215C";
    if (f === "monthly") return "#633806";
    if (f === "weekly") return "#4A1B0C";
    return "#2C2C2A";
}

export default function PaySchedules() {
    const navigate = useNavigate();
    const [overrideModal, setOverrideModal] = useState(null);
  const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadSchedules();
    }, []);

    async function loadSchedules() {
        setLoading(true);
        try {
            const res = await fetch(API + "/api/v1/payroll/schedules", { headers: authHeaders() });
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();
            setSchedules(Array.isArray(data) ? data : []);
            setError("");
        } catch (err) {
            setError("Could not load schedules. " + err.message);
        }
        setLoading(false);
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this schedule? This cannot be undone.")) return;
        try {
            const res = await fetch(API + "/api/v1/payroll/schedules/" + id, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                alert(errData.detail || "Could not delete schedule");
                return;
            }
            loadSchedules();
        } catch (err) {
            alert("Could not delete: " + err.message);
        }
        setOpenMenuId(null);
    }

    async function handleDuplicate(id) {
        try {
            const res = await fetch(API + "/api/v1/payroll/schedules/" + id + "/duplicate", {
                method: "POST",
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error("HTTP " + res.status);
            loadSchedules();
        } catch (err) {
            alert("Could not duplicate: " + err.message);
        }
        setOpenMenuId(null);
    }

    async function handlePauseResume(schedule) {
        const endpoint = schedule.is_paused ? "resume" : "pause";
        try {
            const res = await fetch(API + "/api/v1/payroll/schedules/" + schedule.id + "/" + endpoint, {
                method: "POST",
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error("HTTP " + res.status);
            loadSchedules();
        } catch (err) {
            alert("Could not " + endpoint + ": " + err.message);
        }
        setOpenMenuId(null);
    }

    async function handleSetDefault(id) {
        try {
            const res = await fetch(API + "/api/v1/payroll/schedules/" + id, {
                method: "PATCH",
                headers: authHeaders(),
                body: JSON.stringify({ is_default: true }),
            });
            if (!res.ok) throw new Error("HTTP " + res.status);
            loadSchedules();
        } catch (err) {
            alert("Could not set default: " + err.message);
        }
        setOpenMenuId(null);
    }

    function handleEdit(schedule) {
        setEditingSchedule(schedule);
        setModalOpen(true);
        setOpenMenuId(null);
    }

    function handleModalClose(refresh) {
        setModalOpen(false);
        setEditingSchedule(null);
        if (refresh) loadSchedules();
    }

    const filteredSchedules = schedules.filter(s =>
        !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalEmployees = schedules.reduce((sum, s) => sum + (s.employee_count || 0), 0);
    const dueSchedules = schedules.filter(s => s.is_due);
    const nextPayRun = schedules
        .filter(s => s.next_pay_date && !s.is_paused)
        .sort((a, b) => (a.next_pay_date || "").localeCompare(b.next_pay_date || ""))[0];

    return (
        <div style={{ maxWidth: "100%", margin: 0, padding: "28px 32px 90px", fontFamily: "Inter, -apple-system, sans-serif" }}>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#15A08C", letterSpacing: "0.5px", marginBottom: 6 }}>PAYROLL</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: "#000000", marginBottom: 4 }}>Pay schedules</div>
                    <div style={{ fontSize: 14, color: "#1A2332" }}>Define how and when your team gets paid</div>
                </div>
                <button
                    onClick={() => { setEditingSchedule(null); setModalOpen(true); }}
                    style={{
                        background: "#0E1A1A", color: "white", fontSize: 14, fontWeight: 600,
                        padding: "10px 18px", borderRadius: 10, cursor: "pointer", border: "none",
                        display: "flex", alignItems: "center", gap: 6,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                >
                    <span style={{ fontSize: 16 }}>+</span> New schedule
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                <div style={{ background: "#F8F9FA", borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 12, color: "#1A2332", marginBottom: 4 }}>Total schedules</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: "#000000", fontVariantNumeric: "tabular-nums" }}>{schedules.length}</div>
                </div>
                <div style={{ background: "#F8F9FA", borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 12, color: "#1A2332", marginBottom: 4 }}>Employees on schedules</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: "#000000", fontVariantNumeric: "tabular-nums" }}>{totalEmployees}</div>
                </div>
                <div style={{ background: nextPayRun ? "#E1F5EE" : "#F8F9FA", borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 12, color: nextPayRun ? "#0F6E56" : "#1A2332", marginBottom: 4 }}>Next pay run</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: nextPayRun ? "#04342C" : "#1A2332" }}>
                        {nextPayRun ? formatDate(nextPayRun.next_pay_date) : "-"}
                    </div>
                    {nextPayRun && (
                        <div style={{ fontSize: 11, color: "#0F6E56" }}>{nextPayRun.name}</div>
                    )}
                </div>
                <div style={{ background: dueSchedules.length > 0 ? "#FBEAF0" : "#F8F9FA", borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 12, color: dueSchedules.length > 0 ? "#993556" : "#1A2332", marginBottom: 4 }}>Currently due</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: dueSchedules.length > 0 ? "#4B1528" : "#1A2332", fontVariantNumeric: "tabular-nums" }}>
                        {dueSchedules.length}
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#000000" }}>Your schedules</div>
                <input
                    type="text"
                    placeholder="Search schedules"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8,
                        fontSize: 13, width: 240, fontFamily: "inherit", color: "#1A2332"
                    }}
                />
            </div>

            {loading && (
                <div style={{ padding: 40, textAlign: "center", color: "#1A2332" }}>Loading schedules...</div>
            )}

            {!loading && error && (
                <div style={{ padding: 16, background: "#FCEBEB", borderRadius: 10, color: "#791F1F", fontSize: 13 }}>{error}</div>
            )}

            {!loading && !error && filteredSchedules.length === 0 && (
                <div style={{ padding: 48, textAlign: "center", background: "#F8F9FA", borderRadius: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#000000", marginBottom: 8 }}>No pay schedules yet</div>
                    <div style={{ fontSize: 14, color: "#1A2332", marginBottom: 20 }}>Add your first schedule to start running payroll</div>
                    <button
                        onClick={() => { setEditingSchedule(null); setModalOpen(true); }}
                        style={{
                            background: "#0E1A1A", color: "white", fontSize: 14, fontWeight: 600,
                            padding: "10px 20px", borderRadius: 10, cursor: "pointer", border: "none"
                        }}
                    >
                        Add your first schedule
                    </button>
                </div>
            )}

            {!loading && !error && filteredSchedules.length > 0 && (
                <div style={{ border: "1px solid #E5E7EB", borderRadius: 12 }}>
                    {filteredSchedules.map((schedule, idx) => (
                        <div
                            key={schedule.id}
                            style={{
                                padding: "18px 20px",
                                borderBottom: idx < filteredSchedules.length - 1 ? "1px solid #E5E7EB" : "none",
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 1.5fr 60px",
                                gap: 16,
                                alignItems: "center",
                                background: schedule.is_paused ? "#F8F9FA" : "#FFFFFF",
                                opacity: schedule.is_paused ? 0.6 : 1,
                                position: "relative"
                            }}
                        >
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <div style={{
                                        width: 8, height: 8,
                                        background: periodBadgeColor(schedule.frequency),
                                        borderRadius: "50%"
                                    }} />
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "#000000" }}>{schedule.name}</div>
                                    {schedule.is_default && (
                                        <div style={{
                                            background: "#E1F5EE", color: "#04342C",
                                            fontSize: 10, padding: "2px 8px", borderRadius: 8, fontWeight: 600
                                        }}>DEFAULT</div>
                                    )}
                                    {schedule.is_paused && (
                                        <div style={{
                                            background: "#F1EFE8", color: "#444441",
                                            fontSize: 10, padding: "2px 8px", borderRadius: 8, fontWeight: 600
                                        }}>PAUSED</div>
                                    )}
                                </div>
                                <div style={{ fontSize: 12, color: "#1A2332", marginLeft: 16 }}>
                                    {schedule.periods_per_year} pay periods per year
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 13, color: "#1A2332", marginBottom: 2 }}>Employees</div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: "#000000", fontVariantNumeric: "tabular-nums" }}>
                                    {schedule.employee_count || 0}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, color: "#1A2332", marginBottom: 4 }}>Next pay dates</div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    {schedule.next_pay_date && (
                                        <div style={{
                                            background: periodBadgeBg(schedule.frequency),
                                            color: periodBadgeText(schedule.frequency),
                                            padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600
                                        }}>
                                            {formatDate(schedule.next_pay_date)}
                                <button onClick={(e) => { e.stopPropagation(); setOverrideModal(schedule); }} style={{ marginLeft: 10, background: "#FFFFFF", color: "#0F6E56", border: "1.5px solid #15A08C", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Override</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: "right", position: "relative" }}>
                                <button
                                    onClick={() => setOpenMenuId(openMenuId === schedule.id ? null : schedule.id)}
                                    style={{
                                        background: "transparent", border: "none", cursor: "pointer",
                                        fontSize: 18, color: "#1A2332", padding: 4
                                    }}
                                >⋮</button>
                                {openMenuId === schedule.id && (
                                    <div style={{
                                        position: "absolute", top: 32, right: 20,
                                        background: "#FFFFFF", border: "1px solid #E5E7EB",
                                        borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                                        width: 220, overflow: "hidden", zIndex: 10, textAlign: "left"
                                    }}>
                                        <div onClick={() => handleEdit(schedule)}
                                            style={{ padding: "10px 14px", fontSize: 13, color: "#000000", cursor: "pointer", borderBottom: "1px solid #E5E7EB" }}
                                        >Edit schedule</div>
                                        <div onClick={() => handleDuplicate(schedule.id)}
                                            style={{ padding: "10px 14px", fontSize: 13, color: "#000000", cursor: "pointer", borderBottom: "1px solid #E5E7EB" }}
                                        >Duplicate</div>
                                        <div onClick={() => { navigate("/payroll/employees?schedule=" + schedule.id); setOpenMenuId(null); }}
                                            style={{ padding: "10px 14px", fontSize: 13, color: "#000000", cursor: "pointer", borderBottom: "1px solid #E5E7EB" }}
                                        >View employees ({schedule.employee_count || 0})</div>
                                        {!schedule.is_default && (
                                            <div onClick={() => handleSetDefault(schedule.id)}
                                                style={{ padding: "10px 14px", fontSize: 13, color: "#000000", cursor: "pointer", borderBottom: "1px solid #E5E7EB" }}
                                            >Set as default</div>
                                        )}
                                        <div onClick={() => handlePauseResume(schedule)}
                                            style={{ padding: "10px 14px", fontSize: 13, color: "#000000", cursor: "pointer", borderBottom: "1px solid #E5E7EB" }}
                                        >{schedule.is_paused ? "Resume schedule" : "Pause schedule"}</div>
                                        <div onClick={() => handleDelete(schedule.id)}
                                            style={{ padding: "10px 14px", fontSize: 13, color: "#A32D2D", cursor: "pointer" }}
                                        >Delete schedule</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modalOpen && (
                <PayScheduleModal
                    schedule={editingSchedule}
                    onClose={handleModalClose}
                />
            )}
        
      {overrideModal && (
        <OverrideDateModal
          schedule={overrideModal}
          onClose={() => setOverrideModal(null)}
          onSaved={async () => {
            setOverrideModal(null);
            // Reload schedules
            try {
              const r = await fetch(API + "/api/v1/payroll/schedules", { headers: authHeaders() });
              if (r.ok) {
                const data = await r.json();
                setSchedules(Array.isArray(data) ? data : []);
              }
            } catch(e) { console.error(e); }
          }}
        />
      )}
</div>
    );
}

// ============================================================
// OVERRIDE DATE MODAL
// ============================================================
function OverrideDateModal({ schedule, onClose, onSaved }) {
  const [newDate, setNewDate] = React.useState(schedule.next_pay_date || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [draftCount, setDraftCount] = React.useState(null);

  React.useEffect(function() {
    async function checkDrafts() {
      try {
        const r = await fetch(API + "/api/v1/payroll/runs?status=draft", { headers: authHeaders() });
        if (r.ok) {
          const data = await r.json();
          setDraftCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (e) {
        setDraftCount(0);
      }
    }
    checkDrafts();
  }, []);

  async function handleSave() {
    if (!newDate) { setError("Please choose a date"); return; }
    setSaving(true);
    setError("");
    try {
      const r = await fetch(API + "/api/v1/payroll/schedules/" + schedule.id, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ first_pay_date: newDate })
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error("Save failed: " + txt);
      }
      onSaved();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "grid", placeItems: "center", padding: 20 }} onClick={onClose}>
      <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#fff", borderRadius: 14, padding: 24, maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0E1A1A", marginBottom: 6 }}>Override next pay date</div>
        <div style={{ fontSize: 13, color: "#1A2332", marginBottom: 18, lineHeight: 1.5 }}>
          Manually set the next pay date. Useful for corrections, off-cycle payroll, or testing specific periods.
        </div>

        <div style={{ background: "#FAEEDA", border: "1px solid #F0D89A", borderRadius: 8, padding: "12px 14px", marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ color: "#854F0B", fontSize: 16, fontWeight: 700 }}>&#9888;</div>
          <div style={{ fontSize: 12, color: "#854F0B", lineHeight: 1.5 }}>
            This shifts the schedule anchor. Following pay dates will follow from this new date using the same frequency. Finalized pay runs are not affected.
          </div>
        </div>

        {draftCount !== null && draftCount > 0 && (
          <div style={{ background: "#FCE9E9", border: "1px solid #F0C4C4", borderRadius: 8, padding: "12px 14px", marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ color: "#A32D2D", fontSize: 16, fontWeight: 700 }}>&#9888;</div>
            <div style={{ fontSize: 12, color: "#A32D2D", lineHeight: 1.5 }}>
              You have {draftCount} draft pay run{draftCount === 1 ? "" : "s"}. They may become inconsistent after this change. Review the drafts page before saving.
            </div>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#1A2332", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 8 }}>NEW NEXT PAY DATE</label>
          <input type="date" value={newDate} onChange={function(e) { setNewDate(e.target.value); }} style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, color: "#0E1A1A", fontFamily: "inherit" }} />
        </div>

        {error && (
          <div style={{ background: "#FCE9E9", color: "#A32D2D", padding: "10px 12px", borderRadius: 8, fontSize: 12, marginBottom: 14 }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ background: "transparent", border: "1px solid #E5E7EB", color: "#0E1A1A", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: "#0E1A1A", color: "white", border: "none", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save override"}</button>
        </div>
      </div>
    </div>
  );
}

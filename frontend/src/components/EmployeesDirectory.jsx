import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, ChevronRight, Check, Plus, Mail, X as XIcon } from "lucide-react";

const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

const C = {
  ink: "#12262B", teal: "#15A08C", tealDark: "#0F8474", tealInk: "#0E8A78", tealSoft: "#E3F4F0",
  text: "#1B2533", muted: "#66748B", faint: "#94A0B2",
  line: "#E7EAF0", lineSoft: "#F1F3F7", surface: "#F4F6F8",
  amber: "#B7791F", green: "#1F9D6B",
};

function initialsFrom(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function ddOptions(emps, key) {
  const set = new Set();
  emps.forEach((e) => { const v = e[key]; if (v) set.add(v); });
  return [...set];
}

// Group label inference. If the employee has a department, use it; otherwise derive from role/title.
function deptOf(emp) {
  if (emp.department) return emp.department;
  const t = String(emp.title || emp.role || emp.position || "").toLowerCase();
  if (t.includes("manager") || t.includes("owner") || t.includes("director")) return "Managers";
  if (t.includes("caregiver") || t.includes("aide") || t.includes("nurse")) return "Caregivers";
  if (t.includes("scheduler") || t.includes("admin") || t.includes("coordinator")) return "Office";
  return "Other";
}

function empTypeOf(emp) {
  const t = String(emp.employment_type || emp.employment || emp.emp_type || "").toLowerCase();
  if (t.includes("full")) return "Full-time";
  if (t.includes("part")) return "Part-time";
  if (t.includes("casual") || t.includes("contract")) return "Casual";
  return "Full-time";
}

function statusOf(emp) {
  if (emp.is_active === false) return "off";
  if (emp.readiness?.ready === true || emp.is_payroll_ready === true) return "ready";
  return "setup";
}

export default function EmployeesDirectory({ employees }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [groupBy, setGroupBy] = useState("role");
  const [openMenu, setOpenMenu] = useState(null);
  const [composeFor, setComposeFor] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const wrapRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (!e.target.closest(".dir-dd")) setOpenMenu(null); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && composeFor) setComposeFor(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composeFor]);

  const enriched = useMemo(() => (employees || []).map((e) => ({
    ...e,
    _name: e.full_name || ((e.first_name || "") + " " + (e.last_name || "")).trim() || e.name || "Unnamed",
    _title: e.title || e.role || e.position || "Employee",
    _email: e.email || e.work_email || "",
    _dept: deptOf(e),
    _emp: empTypeOf(e),
    _status: statusOf(e),
    _roleKey: e.role || e.title || e.position || "Other",
  })), [employees]);

  const roleOpts = useMemo(() => {
    const set = new Set();
    enriched.forEach((e) => { if (e._roleKey) set.add(e._roleKey); });
    return [["all", "All roles"], ...[...set].map((r) => [r, r])];
  }, [enriched]);

  const filtered = useMemo(() => enriched.filter((e) => {
    if (role !== "all" && e._roleKey !== role) return false;
    if (statusFilter === "active" && e._status === "off") return false;
    if (statusFilter === "inactive" && e._status !== "off") return false;
    if (q) {
      const needle = q.toLowerCase();
      const hay = (e._name + " " + e._title + " " + e._email).toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  }), [enriched, role, statusFilter, q]);

  const grouped = useMemo(() => {
    if (groupBy === "none") {
      return [["", [...filtered].sort((a, b) => (a._name).localeCompare(b._name))]];
    }
    const key = groupBy === "emp" ? "_emp" : "_dept";
    const order = groupBy === "emp" ? ["Full-time", "Part-time", "Casual"] : ["Managers", "Caregivers", "Office", "Other"];
    const map = new Map();
    filtered.forEach((e) => {
      const k = e[key] || "Other";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(e);
    });
    const keys = [...map.keys()].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    return keys.map((k) => [k, map.get(k)]);
  }, [filtered, groupBy]);

  const onSend = () => {
    if (!composeFor) return;
    const s = encodeURIComponent(subject || "");
    const b = encodeURIComponent(body || "");
    window.location.href = "mailto:" + composeFor._email + "?subject=" + s + "&body=" + b;
    setComposeFor(null);
    setSubject(""); setBody("");
  };

  return (
    <div ref={wrapRef} style={{ fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
          <Search size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, role, or email"
            style={{ width: "100%", border: "1px solid " + C.line, borderRadius: 11, padding: "11px 14px 11px 42px", fontFamily: FONT, fontSize: 14, background: "#fff", color: C.ink }} />
        </div>

        <Dropdown label={roleOpts.find((o) => o[0] === role)?.[1] || "All roles"} open={openMenu === "role"} onToggle={() => setOpenMenu(openMenu === "role" ? null : "role")}
          opts={roleOpts} value={role} onPick={(v) => { setRole(v); setOpenMenu(null); }} />

        <Dropdown label={({active:"Active",inactive:"Inactive",all:"All"})[statusFilter]} open={openMenu === "status"} onToggle={() => setOpenMenu(openMenu === "status" ? null : "status")}
          opts={[["active", "Active"], ["inactive", "Inactive"], ["all", "All"]]} value={statusFilter} onPick={(v) => { setStatusFilter(v); setOpenMenu(null); }} />

        <Dropdown label={({role:"Group by role",emp:"Group by employment",none:"No grouping"})[groupBy]} open={openMenu === "group"} onToggle={() => setOpenMenu(openMenu === "group" ? null : "group")}
          opts={[["role", "Group by role"], ["emp", "Group by employment"], ["none", "No grouping"]]} value={groupBy} onPick={(v) => { setGroupBy(v); setOpenMenu(null); }} />

        <button onClick={() => navigate("/payroll/employees/add")}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT, fontWeight: 600, fontSize: 14, background: C.teal, color: "#fff", border: "1px solid transparent", borderRadius: 11, padding: "10px 16px", cursor: "pointer", boxShadow: "0 1px 2px rgba(21,160,140,0.3)" }}>
          <Plus size={16} /> Add employee
        </button>
      </div>

      <div style={{ fontSize: 13, color: C.muted, margin: "0 2px 14px" }}>
        {filtered.length} {filtered.length === 1 ? "team member" : "team members"}
        {filtered.length !== enriched.length ? " of " + enriched.length : ""}
      </div>

      <div style={{ background: "#fff", border: "1px solid " + C.line, borderRadius: 15, overflow: "hidden", boxShadow: "0 1px 2px rgba(16,26,43,0.04)" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "46px 22px", textAlign: "center", color: C.muted, fontSize: 14 }}>
            {enriched.length === 0 ? "No employees yet. Add your first one to start." : "No team members match your search."}
          </div>
        ) : grouped.map(([groupKey, list], gi) => (
          <React.Fragment key={gi}>
            {groupKey && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 22px", background: "#FAFBFC", borderBottom: "1px solid " + C.line, borderTop: gi === 0 ? "0" : "1px solid " + C.line }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>{groupKey}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.faint }}>{list.length}</span>
              </div>
            )}
            {list.map((emp) => <Row key={emp.id || emp._email || emp._name} emp={emp} groupBy={groupBy}
              onEmail={() => { setComposeFor(emp); setSubject(""); setBody(""); }}
              onView={() => navigate("/payroll/employees/" + (emp.id || ""))} />)}
          </React.Fragment>
        ))}
      </div>

      {composeFor && (
        <>
          <div onClick={() => setComposeFor(null)} style={{ position: "fixed", inset: 0, background: "rgba(16,26,43,0.42)", zIndex: 9998 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#fff", borderRadius: 18, width: "min(520px, 92vw)", boxShadow: "0 24px 60px rgba(16,26,43,0.28)", zIndex: 9999, fontFamily: FONT }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid " + C.line }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, margin: 0 }}>New email</h3>
              <button onClick={() => setComposeFor(null)} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid " + C.line, background: "#fff", color: C.muted, cursor: "pointer", display: "grid", placeItems: "center" }}><XIcon size={16} /></button>
            </div>
            <div style={{ padding: "20px 22px" }}>
              <Field label="To">
                <div style={{ display: "flex", alignItems: "center", gap: 11, border: "1px solid " + C.line, borderRadius: 11, padding: "9px 12px", background: "#FAFBFC" }}>
                  <Avatar text={initialsFrom(composeFor._name)} size={32} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{composeFor._name}</div>
                    <div style={{ fontSize: 12.5, color: C.muted }}>{composeFor._email}</div>
                  </div>
                </div>
              </Field>
              <Field label="Subject">
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject"
                  style={{ width: "100%", border: "1px solid " + C.line, borderRadius: 11, padding: "10px 13px", fontFamily: FONT, fontSize: 14, color: C.ink }} />
              </Field>
              <Field label="Message">
                <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message"
                  style={{ width: "100%", border: "1px solid " + C.line, borderRadius: 11, padding: "10px 13px", fontFamily: FONT, fontSize: 14, color: C.ink, minHeight: 120, resize: "vertical" }} />
              </Field>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderTop: "1px solid " + C.line, gap: 12 }}>
              <span style={{ fontSize: 12, color: C.faint }}>Opens in your email app</span>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setComposeFor(null)} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, background: "#fff", border: "1px solid " + C.line, color: C.ink, borderRadius: 11, padding: "9px 16px", cursor: "pointer" }}>Cancel</button>
                <button onClick={onSend} disabled={!composeFor._email} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, background: composeFor._email ? C.teal : "#C3CBD6", border: "1px solid transparent", color: "#fff", borderRadius: 11, padding: "9px 16px", cursor: composeFor._email ? "pointer" : "not-allowed", boxShadow: composeFor._email ? "0 1px 2px rgba(21,160,140,0.3)" : "none" }}>Send</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ emp, groupBy, onEmail, onView }) {
  const [hover, setHover] = useState(false);
  const status = emp._status;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "grid", gridTemplateColumns: "2.4fr 2.4fr 1.3fr auto", alignItems: "center", gap: 18, padding: "15px 22px", borderBottom: "1px solid " + C.lineSoft, background: hover ? "#FCFDFE" : "transparent", transition: "background 0.12s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
        <Avatar text={initialsFrom(emp._name)} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emp._name}</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginTop: 1 }}>{emp._title}{groupBy !== "emp" ? ", " + emp._emp : ""}</div>
        </div>
      </div>
      <div style={{ fontSize: 13.5, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {emp._email ? <span onClick={onEmail} style={{ color: C.tealInk, cursor: "pointer", textDecoration: "none" }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}>{emp._email}</span>
          : <span style={{ color: C.faint }}>No email on file</span>}
      </div>
      <div>
        {status === "ready" && <Status color={C.green} label="Ready" />}
        {status === "setup" && <Status color={C.amber} label="Needs setup" />}
        {status === "off" && <Status color={C.faint} label="Inactive" />}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, justifySelf: "end" }}>
        {emp._email && (
          <button onClick={onEmail} title="Email" style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid " + C.line, background: "#fff", color: C.muted, cursor: "pointer", display: "grid", placeItems: "center", opacity: hover ? 1 : 0, transform: hover ? "translateX(0)" : "translateX(4px)", transition: "opacity 0.14s, transform 0.14s" }}>
            <Mail size={16} />
          </button>
        )}
        <button onClick={onView} title="View profile" style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid transparent", background: "none", color: C.faint, cursor: "pointer", display: "grid", placeItems: "center" }}>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function Avatar({ text, size = 38 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: C.tealSoft, color: C.tealInk, display: "grid", placeItems: "center", fontWeight: 600, fontSize: size > 32 ? 14 : 12, flex: "0 0 " + size + "px" }}>{text}</div>
  );
}

function Status({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, color }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />{label}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function Dropdown({ label, open, onToggle, opts, value, onPick }) {
  return (
    <div className="dir-dd" style={{ position: "relative" }}>
      <button onClick={onToggle} style={{ display: "inline-flex", alignItems: "center", gap: 9, border: "1px solid " + (open ? "#15A08C" : "#E7EAF0"), boxShadow: open ? "0 0 0 3px " + C.tealSoft : "none", borderRadius: 11, padding: "10px 14px", fontFamily: FONT, fontSize: 13.5, fontWeight: 500, background: "#fff", cursor: "pointer", color: C.text, whiteSpace: "nowrap" }}>
        {label}
        <ChevronDown size={14} style={{ color: C.faint, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid " + C.line, borderRadius: 12, boxShadow: "0 12px 30px rgba(16,26,43,0.14)", padding: 6, minWidth: 184, zIndex: 30 }}>
          {opts.map(([val, lab]) => (
            <button key={val} onClick={() => onPick(val)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", border: 0, background: "none", fontFamily: FONT, fontSize: 13.5, color: value === val ? C.tealInk : C.text, fontWeight: value === val ? 600 : 400, padding: "9px 11px", borderRadius: 8, cursor: "pointer", textAlign: "left" }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.lineSoft}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
              {lab}
              {value === val ? <Check size={15} style={{ color: C.teal }} /> : <span style={{ width: 15 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

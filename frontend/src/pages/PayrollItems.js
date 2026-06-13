import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, X, ChevronDown, ChevronRight,
  Sparkles, CircleDollarSign, Receipt, CalendarClock, MapPin,
  MessageSquareText, Check,
} from "lucide-react";

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
const WARN_TEXT = "#92400E";
const WARN_SOFT = "#FEF3C7";
const SUCCESS_TEXT = "#166534";
const SUCCESS_SOFT = "#DCFCE7";
const INFO_TEXT = "#185FA5";

const PAY_TYPES = [
  { id: "pt1", cat: "Regular pay", name: "Salary", active: true },
  { id: "pt2", cat: "Regular pay", name: "Hourly", active: true },
  { id: "pt3", cat: "Hourly", name: "Hourly 2", active: true },
  { id: "pt4", cat: "Regular pay", name: "Commission", active: true },
  { id: "pt5", cat: "", name: "Overtime Pay", active: true },
  { id: "pt6", cat: "", name: "Double Overtime Pay", active: true },
  { id: "pt7", cat: "", name: "Stat Holiday Pay", active: true },
  { id: "pt8", cat: "", name: "Bonus", active: true },
];
const SCHEDULES = [
  { id: "default", isDefault: true, freq: "Twice a month", name: "Semi-monthly, 15th and End of Month", ends: "14/06/2026", payday: "15/06/2026" },
  { id: "final1", isDefault: false, freq: "Twice a month", name: "Final Pay, Former Employee", ends: "14/06/2026", payday: "15/06/2026" },
  { id: "final2", isDefault: false, freq: "Twice a month", name: "Final Pay, Former Employee 2", ends: "10/06/2026", payday: "15/06/2026" },
];
const LOCATIONS = [
  { id: "primary", isPrimary: true, active: true, name: "Edmonton, AB", address: "49516 Range Road 174, Edmonton, AB T5H0S4" },
];
const DEDUCTIONS = [];

const BTN_TEAL = { background: BRAND, color: "white", fontSize: 14, fontWeight: 600, padding: "10px 18px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" };
const BTN_TEAL_OUT = { background: BG_CARD, color: BRAND_DARK, fontSize: 13.5, fontWeight: 600, padding: "9px 14px", border: "0.5px solid " + BRAND, borderRadius: 9, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7 };
const BTN_OUT = { background: BG_CARD, color: TEXT_PRIMARY, fontSize: 13.5, fontWeight: 600, padding: "9px 14px", border: "0.5px solid " + BORDER, borderRadius: 9, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7 };
const BTN_GHOST = { background: "transparent", color: TEXT_SECONDARY, fontSize: 13.5, fontWeight: 600, padding: "9px 14px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" };
const ICON_BTN = { width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, color: TEXT_SECONDARY, cursor: "pointer" };
const LINK = { color: BRAND_DARK, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const CHIP_OK = { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 12, background: SUCCESS_SOFT, color: SUCCESS_TEXT };
const CHIP_WARN = { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 12, background: WARN_SOFT, color: WARN_TEXT };
const BADGE = { display: "inline-block", background: INFO_TEXT, color: "white", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", padding: "3px 9px", borderRadius: 6 };
const BADGE_PRIMARY = { ...BADGE, background: BRAND };
const NOVA_PILL = { display: "inline-flex", alignItems: "center", gap: 3, background: BRAND, color: "white", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.02em", marginLeft: 4 };

export default function PayrollItems() {
  const navigate = useNavigate();
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const initialExpand = params.get("expand");
  const [expanded, setExpanded] = useState({
    paytypes: initialExpand === "paytypes",
    deductions: initialExpand === "deductions",
    schedules: initialExpand === "schedules",
    locations: initialExpand === "locations",
  });
  const [newItemOpen, setNewItemOpen] = useState(false);
  const newItemRef = useRef(null);

  const toggle = (k) => setExpanded(prev => ({ ...prev, [k]: !prev[k] }));
  const goBack = () => navigate("/payroll/employees");

  useEffect(() => {
    if (!newItemOpen) return;
    const onClick = (e) => {
      if (!newItemRef.current || !newItemRef.current.contains(e.target)) setNewItemOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [newItemOpen]);

  return (
    <div style={{ background: BG_CARD, minHeight: "100vh", width: "100%", fontFamily: "inherit" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "0.5px solid " + BORDER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={ICON_BTN} onClick={goBack}><ArrowLeft size={18} /></span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT_INK, margin: 0, letterSpacing: "-0.01em" }}>Payroll items</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span onClick={() => alert("Feedback form coming next")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: TEXT_SECONDARY, padding: "7px 11px", borderRadius: 8, cursor: "pointer" }}>
            <MessageSquareText size={16} />How can we improve?
          </span>
          <span style={ICON_BTN} onClick={goBack}><X size={18} /></span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 28px 24px", flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, color: TEXT_SECONDARY, maxWidth: 460 }}>Create and manage payroll items for your whole team in one place.</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div ref={newItemRef} style={{ position: "relative" }}>
            <button onClick={() => setNewItemOpen(!newItemOpen)} style={BTN_TEAL_OUT}>New payroll item <ChevronDown size={16} /></button>
            {newItemOpen && (
              <div style={{ position: "absolute", right: 0, top: 46, background: BG_CARD, border: "0.5px solid " + BORDER, borderRadius: 10, boxShadow: "0 10px 30px rgba(20,40,40,0.14)", padding: 6, minWidth: 240, zIndex: 50 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 7, cursor: "pointer", fontSize: 13.5, color: TEXT_PRIMARY }} onClick={() => { setNewItemOpen(false); alert("Create pay type coming next"); }}>
                  <CircleDollarSign size={15} style={{ color: TEXT_SECONDARY }} />Pay type
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 7, cursor: "pointer", fontSize: 13.5, color: TEXT_PRIMARY }} onClick={() => { setNewItemOpen(false); alert("Create deduction or contribution coming next"); }}>
                  <Receipt size={15} style={{ color: TEXT_SECONDARY }} />Deductions &amp; contributions
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 7, cursor: "pointer", fontSize: 13.5, color: TEXT_PRIMARY }} onClick={() => { setNewItemOpen(false); alert("Create pay schedule coming next"); }}>
                  <CalendarClock size={15} style={{ color: TEXT_SECONDARY }} />Pay schedule
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 7, cursor: "pointer", fontSize: 13.5, color: TEXT_PRIMARY }} onClick={() => { setNewItemOpen(false); alert("Create work location coming next"); }}>
                  <MapPin size={15} style={{ color: TEXT_SECONDARY }} />Work location
                </div>
              </div>
            )}
          </div>
          <button onClick={() => alert("Spreadsheet import coming next")} style={BTN_OUT}>
            <Sparkles size={16} style={{ color: BRAND }} />Try spreadsheet import<span style={NOVA_PILL}><Sparkles size={11} />Nova</span>
          </button>
        </div>
      </div>

      <div style={{ padding: "0 28px 24px" }}>
        <AccordionRow open={expanded.paytypes} onToggle={() => toggle("paytypes")} icon={<CircleDollarSign size={20} style={{ color: BRAND }} />} title="Pay types" count={PAY_TYPES.length} chip={<span style={CHIP_OK}><Check size={12} />All set</span>}>
          <PayTypesBody />
        </AccordionRow>
        <AccordionRow open={expanded.deductions} onToggle={() => toggle("deductions")} icon={<Receipt size={20} style={{ color: BRAND }} />} title="Deductions & contributions" count={DEDUCTIONS.length} chip={<span style={CHIP_WARN}>None yet</span>}>
          <div style={{ border: "1px dashed " + BORDER, borderRadius: 10, padding: 22, color: TEXT_SECONDARY, fontSize: 14, background: BG_PAGE }}>
            You need to assign a deduction or contribution to at least one employee first. <span style={LINK} onClick={() => alert("Add deduction coming next")}>Add one</span>
          </div>
        </AccordionRow>
        <AccordionRow open={expanded.schedules} onToggle={() => toggle("schedules")} icon={<CalendarClock size={20} style={{ color: BRAND }} />} title="Pay schedules" count={SCHEDULES.length} chip={<span style={CHIP_OK}>Active</span>}>
          <SchedulesBody onCardClick={(s) => alert("Pay schedule detail coming next")} />
        </AccordionRow>
        <AccordionRow open={expanded.locations} onToggle={() => toggle("locations")} icon={<MapPin size={20} style={{ color: BRAND }} />} title="Work locations" count={LOCATIONS.length} chip={<span style={CHIP_OK}>Active</span>}>
          <LocationsBody onCardClick={(l) => alert("Work location detail coming next")} />
        </AccordionRow>
      </div>

      <div style={{ background: BG_CARD, borderTop: "0.5px solid " + BORDER, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={goBack} style={BTN_GHOST}>Cancel</button>
        <button onClick={goBack} style={BTN_TEAL}>Done</button>
      </div>
    </div>
  );
}

function AccordionRow({ open, onToggle, icon, title, count, chip, children }) {
  return (
    <div style={{ borderBottom: "0.5px solid " + BORDER_LIGHT }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 4px", cursor: "pointer" }}>
        <ChevronRight size={18} style={{ color: TEXT_SECONDARY, transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
        {icon}
        <span style={{ fontSize: 17, fontWeight: 700, color: TEXT_INK }}>{title}</span>
        <span style={{ fontSize: 17, fontWeight: 600, color: TEXT_SECONDARY }}>({count})</span>
        <span style={{ marginLeft: "auto" }}>{chip}</span>
      </div>
      {open && <div style={{ padding: "4px 4px 22px 38px" }}>{children}</div>}
    </div>
  );
}

function RadioOpt({ label, on, onClick }) {
  return (
    <span onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, cursor: "pointer" }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", border: "1.6px solid " + (on ? BRAND : TEXT_TERTIARY), display: "grid", placeItems: "center" }}>
        {on && <span style={{ width: 9, height: 9, borderRadius: "50%", background: BRAND }} />}
      </span>
      {label}
    </span>
  );
}

function PayTypesBody() {
  const [seg, setSeg] = useState("active");
  const active = PAY_TYPES.filter(p => p.active);
  const inactive = PAY_TYPES.filter(p => !p.active);
  const list = seg === "active" ? active : inactive;
  return (
    <>
      <div style={{ display: "flex", gap: 24, marginBottom: 18 }}>
        <RadioOpt label={"Active (" + active.length + ")"} on={seg === "active"} onClick={() => setSeg("active")} />
        <RadioOpt label={"Inactive (" + inactive.length + ")"} on={seg === "inactive"} onClick={() => setSeg("inactive")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
        {list.map(p => (
          <div key={p.id} style={{ border: "0.5px solid " + BORDER, borderRadius: 10, padding: "16px 18px", background: BG_CARD }}>
            {p.cat && <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginBottom: 3 }}>{p.cat}</div>}
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_INK }}>{p.name}</div>
          </div>
        ))}
        {list.length === 0 && <div style={{ gridColumn: "1 / -1", padding: 22, color: TEXT_SECONDARY, fontSize: 14 }}>No {seg} pay types.</div>}
      </div>
    </>
  );
}

function SchedulesBody({ onCardClick }) {
  return (
    <div>
      {SCHEDULES.map(s => (
        <div key={s.id} onClick={() => onCardClick(s)} style={{ border: "0.5px solid " + BORDER, borderRadius: 10, padding: 18, background: BG_CARD, display: "flex", alignItems: "center", gap: 24, cursor: "pointer", marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            {s.isDefault && <div style={{ marginBottom: 8 }}><span style={BADGE}>DEFAULT</span></div>}
            <div style={{ fontSize: 12.5, color: TEXT_TERTIARY }}>{s.freq}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_INK, marginTop: 2 }}>{s.name}</div>
          </div>
          <div style={{ minWidth: 140 }}>
            <div style={{ fontSize: 12, color: TEXT_TERTIARY }}>Pay period ends on</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_INK, marginTop: 2 }}>{s.ends}</div>
          </div>
          <div style={{ minWidth: 140 }}>
            <div style={{ fontSize: 12, color: TEXT_TERTIARY }}>Next payday</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_INK, marginTop: 2 }}>{s.payday}</div>
          </div>
          <ChevronRight size={18} style={{ color: TEXT_TERTIARY }} />
        </div>
      ))}
    </div>
  );
}

function LocationsBody({ onCardClick }) {
  const [seg, setSeg] = useState("active");
  const active = LOCATIONS.filter(l => l.active);
  const inactive = LOCATIONS.filter(l => !l.active);
  const list = seg === "active" ? active : inactive;
  return (
    <>
      <div style={{ display: "flex", gap: 24, marginBottom: 18 }}>
        <RadioOpt label={"Active (" + active.length + ")"} on={seg === "active"} onClick={() => setSeg("active")} />
        <RadioOpt label={"Inactive (" + inactive.length + ")"} on={seg === "inactive"} onClick={() => setSeg("inactive")} />
      </div>
      {list.map(l => (
        <div key={l.id} onClick={() => onCardClick(l)} style={{ border: "0.5px solid " + BORDER, borderRadius: 10, padding: 18, background: BG_CARD, display: "flex", alignItems: "center", gap: 16, cursor: "pointer", marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            {l.isPrimary && <div style={{ marginBottom: 8 }}><span style={BADGE_PRIMARY}>PRIMARY</span></div>}
            <div style={{ fontSize: 12.5, color: TEXT_TERTIARY }}>{l.address}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_INK, marginTop: 2 }}>{l.name}</div>
          </div>
          <ChevronRight size={18} style={{ color: TEXT_TERTIARY }} />
        </div>
      ))}
      {list.length === 0 && <div style={{ padding: 22, color: TEXT_SECONDARY, fontSize: 14 }}>No {seg} work locations.</div>}
    </>
  );
}

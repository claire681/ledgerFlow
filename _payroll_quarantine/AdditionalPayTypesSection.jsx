import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import EditPayTypeDrawer from "./EditPayTypeDrawer";

const TEAL = "#0F9599";
const FONT_FAMILY = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
const BORDER = "#E5E7EB";
const BORDER_LIGHT = "#F3F4F6";
const TEXT = "#0F172A";
const SUBTLE = "#475569";
const MUTED = "#6B7280";

const STORAGE_KEY = "novala_pay_type_assignments_v1";

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return dateStr;
  }
};

export default function AdditionalPayTypesSection({ employee, hasBasePay, country = "CA" }) {
  const [allAssignments, setAllAssignments] = useState({});
  const [drawer, setDrawer] = useState({ open: false, mode: "add", editingId: null });
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setAllAssignments(JSON.parse(stored));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allAssignments));
    } catch (e) {}
  }, [allAssignments]);

  const empId = employee?.id || null;
  const assignments = (empId && allAssignments[empId]) || [];

  const openAdd = () => setDrawer({ open: true, mode: "add", editingId: null });
  const openEdit = (id) => setDrawer({ open: true, mode: "edit", editingId: id });
  const closeDrawer = () => setDrawer({ open: false, mode: "add", editingId: null });

  const saveAssignment = (assignment) => {
    if (!empId) return;
    setAllAssignments((prev) => {
      const existing = prev[empId] || [];
      const isEdit = drawer.mode === "edit" && drawer.editingId;
      const updated = isEdit
        ? existing.map((a) => (a.id === drawer.editingId ? { ...assignment, id: drawer.editingId } : a))
        : [...existing, assignment];
      return { ...prev, [empId]: updated };
    });
    closeDrawer();
  };

  const removeAssignment = (id) => {
    if (!empId) return;
    setAllAssignments((prev) => {
      const existing = prev[empId] || [];
      return { ...prev, [empId]: existing.filter((a) => a.id !== id) };
    });
  };

  const unassignFromDrawer = () => {
    if (drawer.editingId) removeAssignment(drawer.editingId);
    closeDrawer();
  };

  const editingAssignment = drawer.editingId
    ? assignments.find((a) => a.id === drawer.editingId)
    : null;

  const cardStyle = {
    background: "#FFFFFF",
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    fontFamily: FONT_FAMILY,
    opacity: hasBasePay ? 1 : 0.55,
  };

  return (
    <React.Fragment>
      <div style={cardStyle}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 12,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>
            Additional pay types
          </h3>
          {hasBasePay && (
            <button
              onClick={openAdd}
              style={{
                background: "none", border: "none",
                color: TEAL, fontSize: 14, fontWeight: 600,
                cursor: "pointer", padding: "4px 8px",
                fontFamily: FONT_FAMILY,
              }}
            >
              Add
            </button>
          )}
        </div>

        {!hasBasePay && (
          <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.5 }}>
            You will need to set a base pay before you can add any additional pay types.
          </p>
        )}

        {hasBasePay && assignments.length === 0 && (
          <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.5 }}>
            Add bonuses, commissions, overtime or other earnings.
          </p>
        )}

        {hasBasePay && assignments.length > 0 && (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1.4fr 1fr 1fr 0.9fr",
              padding: "8px 0 10px 0",
              borderBottom: `1px solid ${BORDER_LIGHT}`,
              fontSize: 11, fontWeight: 600, color: MUTED,
              textTransform: "uppercase", letterSpacing: "0.05em",
              gap: 12,
            }}>
              <div>Pay Type</div>
              <div>Name</div>
              <div>Rate/Amount</div>
              <div>Effective Date</div>
              <div style={{ textAlign: "right" }}>Actions</div>
            </div>
            {assignments.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1.4fr 1fr 1fr 0.9fr",
                  padding: "16px 0",
                  borderBottom: `1px solid ${BORDER_LIGHT}`,
                  fontSize: 14, color: TEXT, alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ fontWeight: 500 }}>{a.payTypeLabel}</div>
                <div>{a.payTypeLabel}</div>
                <div style={{ color: SUBTLE }}>{a.rateAmount || ""}</div>
                <div style={{ color: SUBTLE }}>{formatDateForDisplay(a.effectiveDate)}</div>
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "flex-end", gap: 4, position: "relative",
                }}>
                  <button
                    onClick={() => openEdit(a.id)}
                    style={{
                      background: "none", border: "none",
                      color: TEAL, fontSize: 14, fontWeight: 500,
                      cursor: "pointer", padding: "4px 8px",
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === a.id ? null : a.id)}
                    aria-label="More actions"
                    style={{
                      background: "none", border: "none",
                      cursor: "pointer", padding: 4,
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <ChevronDown size={16} color={MUTED} />
                  </button>
                  {menuOpenId === a.id && (
                    <React.Fragment>
                      <div
                        onClick={() => setMenuOpenId(null)}
                        style={{
                          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                          zIndex: 4,
                        }}
                      />
                      <div style={{
                        position: "absolute", top: "100%", right: 0, marginTop: 4,
                        background: "#FFFFFF",
                        border: `1px solid ${BORDER_LIGHT}`,
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        zIndex: 5, minWidth: 140, overflow: "hidden",
                      }}>
                        <button
                          onClick={() => { setMenuOpenId(null); openEdit(a.id); }}
                          style={menuItemStyle}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setMenuOpenId(null); removeAssignment(a.id); }}
                          style={{ ...menuItemStyle, color: "#991B1B" }}
                        >
                          Remove
                        </button>
                      </div>
                    </React.Fragment>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EditPayTypeDrawer
        isOpen={drawer.open}
        onClose={closeDrawer}
        mode={drawer.mode}
        initialAssignment={editingAssignment}
        onSave={saveAssignment}
        onUnassign={unassignFromDrawer}
        country={country}
      />
    </React.Fragment>
  );
}

const menuItemStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  background: "none",
  border: "none",
  padding: "10px 16px",
  fontSize: 14,
  cursor: "pointer",
  color: "#0F172A",
  fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
};
